import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import logoAsset from "../assets/vida-emprendedora-logo.png.asset.json";
import perfilAsset from "../assets/reichely-perfil.png.asset.json";

export const Route = createFileRoute("/generador")({
  head: () => ({
    meta: [
      { title: "Generador — Vida Emprendedora" },
      { name: "description", content: "Crea contenido con tu voz, guiada por las skills de Reichely." },
    ],
  }),
  component: GeneradorPage,
});

// Mock skills (later loaded from GitHub repo)
const MOCK_SKILLS = [
  { id: "post-instagram", name: "Post de Instagram", description: "Caption cálido y cercano, con CTA suave." },
  { id: "email-newsletter", name: "Newsletter", description: "Email íntimo tipo carta a una amiga." },
  { id: "reel-script", name: "Guion de Reel", description: "Hook + desarrollo + cierre, 30-45s." },
  { id: "historia-venta", name: "Historia de venta", description: "Stories conectadas con un objetivo de venta." },
];

const MOCK_FORMATS = ["WhatsApp", "Instagram", "Carrusel"] as const;

export default function GeneradorPage() {
  const [skill, setSkill] = useState(MOCK_SKILLS[0].id);
  const [format, setFormat] = useState<typeof MOCK_FORMATS[number]>("Instagram");
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const currentSkill = MOCK_SKILLS.find((s) => s.id === skill)!;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOutput(null);
    // Mock generation (replaced by Supabase Edge Function in Phase 3)
    setTimeout(() => {
      setOutput(
        `✨ ${currentSkill.name} — ${format}\n\n` +
        `Hoy quiero contarte algo sobre "${idea || "tu idea"}".\n\n` +
        `A veces creemos que tenemos que tenerlo todo claro antes de empezar. Pero la verdad es que la claridad llega caminando, no esperando.\n\n` +
        `Si esto te resuena, cuéntamelo en comentarios. Leo cada uno. 💛\n\n` +
        `— Mock generado. Cuando conectemos el backend, este texto vendrá de tu IA con la skill seleccionada.`
      );
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoAsset.url} alt="" className="w-9 h-9 object-contain" />
            <span className="text-sm tracking-[0.15em] uppercase text-foreground/80">Vida Emprendedora</span>
          </Link>
          <img src={perfilAsset.url} alt="Reichely" className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/30" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 pb-24">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">Tu estudio de creación</p>
          <h1 className="text-4xl sm:text-5xl serif text-foreground leading-tight">
            ¿Qué quieres<br />contar hoy?
          </h1>
        </div>

        <form onSubmit={handleGenerate} className="space-y-7 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-card)]">
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
              Skill
            </label>
            <div className="grid gap-2">
              {MOCK_SKILLS.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setSkill(s.id)}
                  className={`text-left px-4 py-3 rounded-lg border transition ${
                    skill === s.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <div className="font-medium text-foreground text-sm">{s.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
              Formato
            </label>
            <div className="flex flex-wrap gap-2">
              {MOCK_FORMATS.map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-4 py-2 rounded-full text-sm border transition ${
                    format === f
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/40"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="idea" className="block text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
              Tu idea, en tus palabras
            </label>
            <textarea
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={5}
              placeholder="Cuéntame qué quieres transmitir… tal cual te sale, sin pulir."
              className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !idea.trim()}
            className="w-full py-3.5 rounded-lg text-primary-foreground font-medium tracking-wide transition-all hover:opacity-95 disabled:opacity-50 shadow-[var(--shadow-soft)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            {loading ? "Creando con alma…" : "Generar contenido"}
          </button>
        </form>

        {output && (
          <article className="mt-8 rounded-2xl border border-primary/20 bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-[0.2em] text-primary">Tu contenido</span>
              <button
                onClick={() => navigator.clipboard.writeText(output)}
                className="text-xs text-muted-foreground hover:text-primary transition"
              >
                Copiar
              </button>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-foreground">
              {output}
            </pre>
          </article>
        )}
      </main>
    </div>
  );
}
