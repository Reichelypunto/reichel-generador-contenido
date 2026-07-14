/**
 * CarouselPreview.tsx
 *
 * v4 — cierre de la funcionalidad de edición y robustez visual:
 *
 * - Tamaño de letra automático según longitud del texto (ya no se
 *   desborda un slide si el copy es más largo de lo habitual).
 * - Edición estructural completa: añadir, eliminar y mover slides
 *   (antes solo se podía editar el texto).
 * - Logo real de Vida Emprendedora restaurado (ahora que los slides son
 *   nodos React normales y no un iframe, la imagen es same-origin y no
 *   hay riesgo de que el export falle por CORS). RRSS y Keles & Reichel
 *   no tienen logo — usan el círculo con inicial.
 * - Export a PNG 100% en el navegador (html-to-image + jszip), sin
 *   servidor ni Playwright.
 *
 * Fuera de alcance a propósito (no es un "flequillo", es una feature
 * distinta): fondos con foto en vez de color plano, que requeriría un
 * flujo de subida de imágenes. Todo lo demás de la edición y el diseño
 * de texto está cerrado en este archivo.
 *
 * Colócalo en: src/components/CarouselPreview.tsx
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { parseCarouselOutput } from "@/lib/design/parse-carousel-output";
import { getBrandTokens, FONTS, type BrandId } from "@/lib/design/brands";
import logoAsset from "../assets/vida-emprendedora-logo.png.asset.json";

interface CarouselPreviewProps {
  /** El string tal cual devuelve generarContenido() */
  rawOutput: string;
  /** Marca activa — determina paleta, tipografía y logo. Default: vida-emprendedora */
  brandId?: BrandId;
}

interface EditableSlide {
  /** Id estable para React, independiente del número de slide mostrado */
  id: string;
  /** Número de slide mostrado (1-indexado, se recalcula tras añadir/mover/eliminar) */
  index: number;
  copy: string;
}

const SLIDE_W = 420;
const SLIDE_H = 525;
const EXPORT_SCALE = 1080 / SLIDE_W; // 2.5714... → salida real 1080x1350
const MIN_SLIDES = 3;

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

function renumber(slides: EditableSlide[]): EditableSlide[] {
  return slides.map((s, i) => ({ ...s, index: i + 1 }));
}

/** Tamaño de letra automático — evita que un slide con mucho texto se desborde. */
function fontSizeFor(copy: string, isFirst: boolean): number {
  const base = isFirst ? 30 : 24;
  const len = copy.length;
  if (len <= 60) return base;
  if (len <= 110) return base - 3;
  if (len <= 160) return base - 6;
  return Math.max(base - 9, 15);
}

export function CarouselPreview({ rawOutput, brandId = "vida-emprendedora" }: CarouselPreviewProps) {
  const brand = getBrandTokens(brandId);
  const hasRealLogo = brandId === "vida-emprendedora";
  const parsed = useMemo(() => parseCarouselOutput(rawOutput), [rawOutput]);

  const [slides, setSlides] = useState<EditableSlide[]>(() => parsed.slides.map((s) => ({ id: makeId(), ...s })));
  const [caption, setCaption] = useState(parsed.caption ?? "");
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const refs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    setSlides(parsed.slides.map((s) => ({ id: makeId(), ...s })));
    setCaption(parsed.caption ?? "");
    setCurrent(0);
  }, [parsed]);

  if (slides.length === 0) {
    return (
      <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-foreground">{rawOutput}</pre>
    );
  }

  const total = slides.length;
  const gradient = `linear-gradient(165deg, ${brand.DARK} 0%, ${brand.PRIMARY} 55%, ${brand.LIGHT} 100%)`;

  function bgFor(idx: number) {
    if (idx === 0) return { css: brand.LIGHT_BG, isLight: true, isGradient: false };
    if (idx === total - 1) return { css: gradient, isLight: false, isGradient: true };
    const isLight = idx % 2 === 0;
    return { css: isLight ? brand.LIGHT_BG : brand.DARK_BG, isLight, isGradient: false };
  }

  function updateCopy(idx: number, value: string) {
    setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, copy: value } : s)));
  }

  function addSlideAfter(idx: number) {
    setSlides((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, { id: makeId(), index: 0, copy: "Nuevo slide — escribe aquí" });
      return renumber(next);
    });
    setCurrent(idx + 1);
    setEditing(true);
  }

  function removeSlide(idx: number) {
    setSlides((prev) => {
      if (prev.length <= MIN_SLIDES) return prev;
      const next = prev.filter((_, i) => i !== idx);
      return renumber(next);
    });
    setCurrent((c) => Math.max(0, Math.min(c, slides.length - 2)));
  }

  function moveSlide(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= slides.length) return;
    setSlides((prev) => {
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return renumber(next);
    });
    setCurrent(j);
  }

  async function captureSlide(idx: number): Promise<string> {
    const node = refs.current[idx];
    if (!node) throw new Error(`No se encontró el slide ${idx + 1}`);
    if (document.fonts?.ready) await document.fonts.ready;
    return toPng(node, {
      pixelRatio: EXPORT_SCALE,
      width: SLIDE_W,
      height: SLIDE_H,
      cacheBust: true,
      style: { transform: "none" },
    });
  }

  async function exportZip() {
    setExporting(true);
    setExportDone(0);
    setExportError(null);
    try {
      const zip = new JSZip();
      for (let i = 0; i < total; i++) {
        const dataUrl = await captureSlide(i);
        zip.file(`slide_${i + 1}.png`, dataUrl.split(",")[1], { base64: true });
        setExportDone(i + 1);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "carrusel.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "No se pudo exportar el carrusel.");
    } finally {
      setExporting(false);
    }
  }

  async function exportCurrent() {
    setExportError(null);
    try {
      const dataUrl = await captureSlide(current);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `slide_${current + 1}.png`;
      a.click();
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "No se pudo exportar este slide.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-2xl overflow-hidden shadow-[var(--shadow-card)] border border-border" style={{ width: SLIDE_W }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          {hasRealLogo ? (
            <img src={logoAsset.url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" crossOrigin="anonymous" />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
              style={{ background: brand.PRIMARY, fontFamily: FONTS.heading }}
            >
              {brand.name.charAt(0)}
            </div>
          )}
          <span className="text-[13px] font-medium truncate">{brand.handle ?? brand.name}</span>
        </div>

        <div style={{ width: SLIDE_W, height: SLIDE_H, overflow: "hidden", position: "relative" }}>
          <div
            style={{
              display: "flex",
              width: SLIDE_W * total,
              height: SLIDE_H,
              transform: `translateX(-${current * SLIDE_W}px)`,
              transition: "transform 0.3s ease",
            }}
          >
            {slides.map((slide, idx) => {
              const bg = bgFor(idx);
              const isFirst = idx === 0;
              const isLast = idx === total - 1;
              const textColor = bg.isLight ? brand.DARK_BG : "#fff";
              const tagColor = bg.isGradient ? "rgba(255,255,255,0.6)" : bg.isLight ? brand.PRIMARY : brand.LIGHT;
              const size = fontSizeFor(slide.copy, isFirst);

              return (
                <div
                  key={slide.id}
                  ref={(el) => {
                    refs.current[idx] = el;
                  }}
                  style={{
                    width: SLIDE_W,
                    height: SLIDE_H,
                    flexShrink: 0,
                    background: bg.css,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: isFirst || isLast ? "center" : "flex-end",
                    padding: "0 36px 52px",
                    boxSizing: "border-box",
                    overflow: "hidden",
                  }}
                >
                  {isFirst && (
                    <div style={{ position: "absolute", top: 40, left: 36, display: "flex", alignItems: "center", gap: 10 }}>
                      {hasRealLogo ? (
                        <img
                          src={logoAsset.url}
                          alt=""
                          crossOrigin="anonymous"
                          style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: brand.PRIMARY,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: FONTS.heading,
                            fontSize: 16,
                          }}
                        >
                          {brand.name.charAt(0)}
                        </div>
                      )}
                      <span style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 500, color: textColor }}>{brand.name}</span>
                    </div>
                  )}

                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: tagColor,
                      marginBottom: 12,
                    }}
                  >
                    {isLast ? "Conclusión" : isFirst ? "Empieza aquí" : `Slide ${slide.index}`}
                  </span>

                  {editing ? (
                    <textarea
                      value={slide.copy}
                      onChange={(e) => updateCopy(idx, e.target.value)}
                      style={{
                        fontFamily: FONTS.heading,
                        fontWeight: isFirst ? 600 : 500,
                        fontSize: size,
                        lineHeight: 1.25,
                        color: textColor,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px dashed rgba(128,128,128,0.5)",
                        borderRadius: 6,
                        padding: 6,
                        resize: "vertical",
                        outline: "none",
                        minHeight: 100,
                      }}
                    />
                  ) : (
                    <p
                      style={{
                        fontFamily: FONTS.heading,
                        fontWeight: isFirst ? 600 : 500,
                        fontSize: size,
                        lineHeight: 1.25,
                        letterSpacing: "-0.3px",
                        color: textColor,
                        margin: 0,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {slide.copy}
                    </p>
                  )}

                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 28px 20px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, height: 3, background: bg.isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${((idx + 1) / total) * 100}%`, background: bg.isLight ? brand.PRIMARY : "#fff", borderRadius: 2 }} />
                    </div>
                    <span style={{ fontFamily: FONTS.body, fontSize: 11, color: bg.isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.4)" }}>
                      {idx + 1}/{total}
                    </span>
                  </div>

                  {!isLast && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 48,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `linear-gradient(to right, transparent, ${bg.isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)"})`,
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9 6l6 6-6 6"
                          stroke={bg.isLight ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.35)"}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            aria-label="Slide anterior"
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "none",
              background: "rgba(0,0,0,0.35)",
              color: "#fff",
              cursor: current === 0 ? "default" : "pointer",
              opacity: current === 0 ? 0.3 : 1,
            }}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
            disabled={current === total - 1}
            aria-label="Slide siguiente"
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "none",
              background: "rgba(0,0,0,0.35)",
              color: "#fff",
              cursor: current === total - 1 ? "default" : "pointer",
              opacity: current === total - 1 ? 0.3 : 1,
            }}
          >
            ›
          </button>
        </div>

        <div className="flex justify-center gap-1 py-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Ir al slide ${i + 1}`}
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                border: "none",
                background: i === current ? brand.PRIMARY : "rgba(0,0,0,0.15)",
                padding: 0,
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {editing && (
          <div className="flex flex-wrap items-center justify-center gap-2 px-4 pb-3">
            <button
              type="button"
              onClick={() => moveSlide(current, -1)}
              disabled={current === 0}
              className="text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-md border border-border disabled:opacity-30"
            >
              ← Mover
            </button>
            <button
              type="button"
              onClick={() => moveSlide(current, 1)}
              disabled={current === total - 1}
              className="text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-md border border-border disabled:opacity-30"
            >
              Mover →
            </button>
            <button
              type="button"
              onClick={() => addSlideAfter(current)}
              className="text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-md border border-border"
            >
              + Añadir slide
            </button>
            <button
              type="button"
              onClick={() => removeSlide(current)}
              disabled={total <= MIN_SLIDES}
              className="text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-md border border-destructive/40 text-destructive disabled:opacity-30"
              title={total <= MIN_SLIDES ? `Mínimo ${MIN_SLIDES} slides` : undefined}
            >
              Eliminar slide
            </button>
          </div>
        )}
      </div>

      <div className="w-full rounded-xl border border-border bg-card p-4" style={{ maxWidth: SLIDE_W }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-[0.15em] text-primary">Caption</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(caption);
              setCopiedCaption(true);
              setTimeout(() => setCopiedCaption(false), 2000);
            }}
            className="text-xs text-muted-foreground hover:text-primary transition"
          >
            {copiedCaption ? "✓ Copiado" : "Copiar"}
          </button>
        </div>
        {editing ? (
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            className="w-full text-sm text-foreground bg-transparent border border-dashed border-border rounded-md p-2 resize-vertical outline-none"
          />
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{caption || "—"}</p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className="text-xs uppercase tracking-[0.15em] px-4 py-2 rounded-lg border border-border transition"
          style={editing ? { background: brand.PRIMARY, color: "#fff", borderColor: brand.PRIMARY } : undefined}
        >
          {editing ? "Terminar edición" : "Editar carrusel"}
        </button>
        <button
          type="button"
          onClick={exportCurrent}
          className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition px-4 py-2 rounded-lg border border-border"
        >
          Descargar slide actual
        </button>
        <button
          type="button"
          onClick={exportZip}
          disabled={exporting}
          className="text-xs uppercase tracking-[0.15em] text-white px-4 py-2 rounded-lg disabled:opacity-50"
          style={{ background: brand.PRIMARY }}
        >
          {exporting ? `Exportando ${exportDone}/${total}…` : `Descargar las ${total} imágenes (.zip)`}
        </button>
      </div>

      {exportError && <p className="text-sm text-destructive">{exportError}</p>}
    </div>
  );
}
