/**
 * CarouselPreview.tsx
 *
 * Reemplaza el bloque `<pre>{output}</pre>` de
 * src/routes/_authenticated/generador.tsx cuando formato === "carrusel".
 *
 * Renderiza el HTML generado por carousel-design.ts dentro de un <iframe>,
 * así lo que ve la usuaria en la app es EXACTAMENTE lo mismo que va a
 * exportarse como PNG (mismo motor de render, mismo ancho de 420px) —
 * evita el error nº1 de la lista de "Common Export Mistakes" del método
 * de Maverick: que el preview y el export no coincidan.
 *
 * Colócalo en: src/components/CarouselPreview.tsx
 */

import { useMemo, useState } from "react";
import { buildCarouselHtml } from "@/lib/design/carousel-design";
import { parseCarouselOutput } from "@/lib/design/parse-carousel-output";
import logoAsset from "../assets/vida-emprendedora-logo.png.asset.json";

interface CarouselPreviewProps {
  /** El string tal cual devuelve generarContenido() */
  rawOutput: string;
  brandName?: string;
  /** Llamada al endpoint de exportación (ver export-carousel.ts / server-export.functions.ts) */
  onExport?: (html: string) => Promise<void>;
}

export function CarouselPreview({ rawOutput, brandName = "Vida Emprendedora", onExport }: CarouselPreviewProps) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const parsed = useMemo(() => parseCarouselOutput(rawOutput), [rawOutput]);

  const html = useMemo(() => {
    if (parsed.slides.length === 0) return null;
    return buildCarouselHtml({
      slides: parsed.slides,
      logoUrl: logoAsset.url,
      brandName,
    });
  }, [parsed, brandName]);

  if (!html) {
    // No se pudo parsear como carrusel (formato inesperado del modelo) —
    // fallback al texto plano para no perder el contenido.
    return (
      <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-foreground">
        {rawOutput}
      </pre>
    );
  }

  const handleExport = async () => {
    if (!onExport) return;
    setExporting(true);
    setExportError(null);
    try {
      await onExport(html);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "No se pudo exportar el carrusel.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-2xl overflow-hidden shadow-[var(--shadow-card)] border border-border">
        <iframe
          title="Previsualización del carrusel"
          srcDoc={html}
          sandbox="allow-scripts"
          style={{ width: 420, height: 660, border: "none", display: "block" }}
        />
      </div>

      {parsed.caption && (
        <div className="w-full max-w-[420px] rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-[0.15em] text-primary">Caption</span>
            <button
              onClick={() => navigator.clipboard.writeText(parsed.caption ?? "")}
              className="text-xs text-muted-foreground hover:text-primary transition"
            >
              Copiar
            </button>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{parsed.caption}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => navigator.clipboard.writeText(rawOutput)}
          className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition px-4 py-2 rounded-lg border border-border"
        >
          Copiar texto
        </button>
        {onExport && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="text-xs uppercase tracking-[0.15em] text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-50"
            style={{ background: "var(--gradient-primary)" }}
          >
            {exporting ? "Exportando…" : "Exportar PNGs (1080×1350)"}
          </button>
        )}
      </div>

      {exportError && <p className="text-sm text-destructive">{exportError}</p>}
    </div>
  );
}
