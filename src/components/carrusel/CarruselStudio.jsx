import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { generarCarrusel } from "@/lib/api/generate.functions";
import {
  BRANDS,
  applyProfile,
  SlideCanvas,
  EditPanel,
  sysP,
  buildCarruselP,
  buildCaptionFromSlidesP,
  parseCaptionOnly,
  parseCarruselTolerante,
  copyText,
  dlZip,
  FONT_LOADS,
} from "./core.jsx";

const INTENCIONES = ["Posicionamiento", "Autoridad", "Venta Sutil"];
const ESTILOS = ["Negativo", "Info Secreta", "Controversial"];
const MOTORES = ["Aspiración", "Educación", "Impacto", "Reflejo"];
const VISUALES = [
  { id: "rrss", label: "Papel crema" },
  { id: "kr", label: "Oscuro y crema" },
];

const NUEVA = () => ({
  text: "Nueva slide", label: "EXTRA", bgImg: null, acento: null, showAvatar: true,
  sizeAdj: 1, offsetX: 0, offsetY: 0, lineOffsets: [], moveMode: "linea", bgVideoURL: null,
  imgOffsetX: 0, imgOffsetY: 0, editMode: "texto", textColor: null, stickers: [],
  literalFormat: true, titleFont: null, weightOverride: null,
});

// Lo que se guarda en la base de datos (sin imágenes, que no son serializables)
function serializar(parsed, visual, zipName) {
  if (!parsed) return null;
  return {
    visual,
    zipName,
    caption: parsed.caption || "",
    variaciones: parsed.variaciones || "",
    slides: (parsed.slides || []).map((s) => {
      const { bgImg, stickers, ...rest } = s;
      return { ...rest, bgImg: null, stickers: (stickers || []).filter((st) => st.type === "emoji") };
    }),
  };
}

export default function CarruselStudio({ perfil, avatarImg }) {
  const generar = useServerFn(generarCarrusel);

  const [visual, setVisual] = useState("rrss");
  const [intencion, setIntencion] = useState("Posicionamiento");
  const [estilo, setEstilo] = useState("Negativo");
  const [motor, setMotor] = useState("Aspiración");
  const [tema, setTema] = useState("");
  const [zipName, setZipName] = useState("");

  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [zipStatus, setZipStatus] = useState("");
  const [fontsReady, setFontsReady] = useState(false);
  const [showEdit, setShowEdit] = useState(true);
  const [restaurado, setRestaurado] = useState(false);

  const canvasRefs = useRef({});
  const brand = BRANDS[visual];

  // Marca de la alumna -> paleta y textos de las slides
  applyProfile({
    nombre: perfil?.marca_nombre || "",
    handle: perfil?.marca_handle || "",
    negocio: perfil?.marca_negocio || "",
    audiencia: perfil?.marca_audiencia || "",
    tono: perfil?.marca_tono || "",
    genero: perfil?.marca_genero || "femenino",
    persona: perfil?.marca_persona || "yo",
    idioma: perfil?.marca_idioma || "España",
    evitar: perfil?.marca_evitar || "",
    firma: perfil?.marca_firma || "",
    cta: perfil?.marca_cta || "",
    color: perfil?.marca_color || "#a3134b",
    colorOscuro: perfil?.marca_color_oscuro || "#0e2e64",
  });

  useEffect(() => {
    FONT_LOADS().then(() => setFontsReady(true)).catch(() => setFontsReady(true));
  }, []);

  // Recuperar el trabajo guardado
  useEffect(() => {
    let cancel = false;
    supabase
      .from("trabajos")
      .select("contenido")
      .maybeSingle()
      .then(({ data }) => {
        if (cancel) return;
        const c = data && data.contenido;
        if (c && Array.isArray(c.slides) && c.slides.length) {
          setParsed({ slides: c.slides, caption: c.caption || "", variaciones: c.variaciones || "" });
          if (c.visual) setVisual(c.visual);
          if (c.zipName) setZipName(c.zipName);
        }
        setRestaurado(true);
      });
    return () => { cancel = true; };
  }, []);

  // Autoguardado (en la cuenta de la alumna)
  useEffect(() => {
    if (!restaurado || !parsed) return;
    const payload = serializar(parsed, visual, zipName);
    const t = setTimeout(async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;
      if (!uid) return;
      await supabase.from("trabajos").upsert({ user_id: uid, contenido: payload });
      setStatus("Guardado");
      setTimeout(() => setStatus(""), 1500);
    }, 1500);
    return () => clearTimeout(t);
  }, [parsed, visual, zipName, restaurado]);

  const updateSlide = useCallback((i, key, val) => {
    setParsed((p) => { const s = [...p.slides]; s[i] = { ...s[i], [key]: val }; return { ...p, slides: s }; });
  }, []);
  const addSlide = () => setParsed((p) => ({ ...p, slides: [...p.slides, NUEVA()] }));
  const insertSlideAt = (pos) => setParsed((p) => { const s = [...p.slides]; s.splice(pos, 0, NUEVA()); return { ...p, slides: s }; });
  const splitSlide = (i, start, end) => setParsed((p) => {
    const s = [...p.slides]; const full = s[i].text || "";
    const selected = full.slice(start, end).trim();
    const remaining = (full.slice(0, start) + full.slice(end)).replace(/\n{3,}/g, "\n\n").trim();
    if (!selected) return p;
    s[i] = { ...s[i], text: remaining };
    s.splice(i + 1, 0, { ...NUEVA(), text: selected });
    return { ...p, slides: s };
  });
  const delSlide = (i) => setParsed((p) => (p.slides.length <= 3 ? p : { ...p, slides: p.slides.filter((_, j) => j !== i) }));
  const moveSlide = (i, dir) => setParsed((p) => { const s = [...p.slides]; const j = i + dir; if (j < 0 || j >= s.length) return p; const t = s[i]; s[i] = s[j]; s[j] = t; return { ...p, slides: s }; });
  const setBg = (i, img) => { updateSlide(i, "bgImg", img); if (img) { updateSlide(i, "imgOffsetX", 0); updateSlide(i, "imgOffsetY", 0); } };
  const addSticker = (i, partial) => setParsed((p) => {
    const s = [...p.slides]; const cur = s[i].stickers || [];
    s[i] = { ...s[i], stickers: [...cur, { id: Date.now() + Math.random(), x: 75, y: 50, scale: 1, ...partial }] };
    return { ...p, slides: s };
  });
  const updateSticker = (i, id, changes) => setParsed((p) => {
    const s = [...p.slides]; const cur = s[i].stickers || [];
    s[i] = { ...s[i], stickers: cur.map((st) => (st.id === id ? { ...st, ...changes } : st)) };
    return { ...p, slides: s };
  });
  const deleteSticker = (i, id) => setParsed((p) => {
    const s = [...p.slides]; const cur = s[i].stickers || [];
    s[i] = { ...s[i], stickers: cur.filter((st) => st.id !== id) };
    return { ...p, slides: s };
  });

  async function generarTodo() {
    if (!tema.trim()) return;
    setLoading(true); setError(""); canvasRefs.current = {};
    try {
      const res = await generar({
        data: {
          system: sysP(visual),
          prompt: buildCarruselP({ brand: visual, intencion, estilo, motor, tema: tema.trim().slice(0, 4000) }),
        },
      });
      const out = parseCarruselTolerante(res.contenido || "");
      if (!out.slides.length) throw new Error("La IA ha devuelto algo que no he sabido leer. Vuelve a intentarlo.");
      setParsed(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha salido mal. Vuelve a intentarlo.");
    } finally {
      setLoading(false);
    }
  }

  async function regenerarCaption() {
    if (!parsed) return;
    setLoading(true); setError("");
    try {
      const slidesText = parsed.slides.map((s, i) => "SLIDE " + (i + 1) + ": " + (s.text || "")).join("\n\n");
      const res = await generar({
        data: { system: sysP(visual), prompt: buildCaptionFromSlidesP(slidesText.slice(0, 12000), visual === "kr") },
      });
      const cap = parseCaptionOnly(res.contenido || "");
      setParsed((p) => ({ ...p, caption: cap.caption || p.caption, variaciones: cap.variaciones || p.variaciones }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha salido mal.");
    } finally {
      setLoading(false);
    }
  }

  const total = parsed ? parsed.slides.length : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-[var(--shadow-card)] space-y-5">
        <Grupo label="Estilo visual">
          {VISUALES.map((v) => <Chip key={v.id} activo={visual === v.id} onClick={() => setVisual(v.id)}>{v.label}</Chip>)}
        </Grupo>
        <Grupo label="Intención">
          {INTENCIONES.map((v) => <Chip key={v} activo={intencion === v} onClick={() => setIntencion(v)}>{v}</Chip>)}
        </Grupo>
        <Grupo label="Estilo de ejecución">
          {ESTILOS.map((v) => <Chip key={v} activo={estilo === v} onClick={() => setEstilo(v)}>{v}</Chip>)}
        </Grupo>
        <Grupo label="Motor viral">
          {MOTORES.map((v) => <Chip key={v} activo={motor === v} onClick={() => setMotor(v)}>{v}</Chip>)}
        </Grupo>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Tema o texto de entrada</p>
          <textarea
            value={tema}
            onChange={(e) => setTema(e.target.value.slice(0, 4000))}
            rows={5}
            placeholder="Escribe el tema o pega el texto que quieres convertir en carrusel…"
            className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition resize-none text-[15px] leading-relaxed"
          />
          <p className="text-[11px] text-muted-foreground mt-1">{tema.length}/4000</p>
        </div>
        <button
          onClick={generarTodo}
          disabled={loading || !tema.trim()}
          className="w-full py-4 rounded-xl text-primary-foreground font-medium tracking-wide transition-all hover:opacity-95 disabled:opacity-50 shadow-[var(--shadow-soft)]"
          style={{ background: "var(--gradient-primary)" }}
        >
          {loading ? "Creando…" : "Generar carrusel"}
        </button>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {status && <p className="text-xs text-muted-foreground">{status}</p>}
      </section>

      {parsed && (
        <>
          <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <input
                value={zipName}
                onChange={(e) => setZipName(e.target.value)}
                placeholder="nombre-del-carrusel"
                className="flex-1 min-w-[160px] px-3 py-2 rounded-lg bg-background border border-input text-sm"
              />
              <button
                onClick={() => dlZip(canvasRefs.current, total, brand, zipName, setZipStatus, parsed.slides)}
                className="px-4 py-2 rounded-lg border border-primary text-primary text-sm"
              >
                ↓ Descargar ZIP
              </button>
              <button onClick={() => setShowEdit((v) => !v)} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground">
                {showEdit ? "Ocultar textos" : "Editar textos"}
              </button>
            </div>
            {zipStatus && <p className="text-xs text-muted-foreground">{zipStatus}</p>}
          </section>

          {showEdit && (
            <div className="rounded-2xl border border-border bg-card p-4 overflow-x-auto">
              <EditPanel
                slides={parsed.slides}
                onUpdate={updateSlide}
                onAdd={addSlide}
                onInsertAt={insertSlideAt}
                onSplit={splitSlide}
                onDelete={delSlide}
                onMove={moveSlide}
                brand={visual}
              />
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            {parsed.slides.map((sl, i) => (
              <SlideCanvas
                key={i + (sl.text || "") + (sl.acento || "") + (sl.bgImg ? "1" : "0")}
                slide={sl}
                idx={i}
                total={total}
                brand={visual}
                avatarImg={avatarImg}
                fontsReady={fontsReady}
                canvasRefs={canvasRefs}
                onBgUpload={setBg}
                onBgVideoUpload={() => {}}
                onUpdate={updateSlide}
                onAddSticker={addSticker}
                onUpdateSticker={updateSticker}
                onDeleteSticker={deleteSticker}
              />
            ))}
          </div>

          <section className="rounded-2xl border border-primary/20 bg-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-primary">Caption</span>
              <div className="flex gap-3">
                <button onClick={regenerarCaption} className="text-xs text-muted-foreground hover:text-primary">Rehacer caption</button>
                <button onClick={() => copyText(parsed.caption || "", () => setStatus("Copiado"))} className="text-xs text-muted-foreground hover:text-primary">Copiar</button>
              </div>
            </div>
            <textarea
              value={parsed.caption || ""}
              onChange={(e) => setParsed((p) => ({ ...p, caption: e.target.value }))}
              rows={8}
              className="w-full px-4 py-3 rounded-lg bg-background border border-input text-[15px] leading-relaxed resize-y"
            />
            {parsed.variaciones && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Variaciones de gancho</p>
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{parsed.variaciones}</pre>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Grupo({ label, children }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ activo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm border transition ${activo ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
    >
      {children}
    </button>
  );
}
