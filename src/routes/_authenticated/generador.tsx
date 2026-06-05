import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import logoAsset from "../../assets/vida-emprendedora-logo.png.asset.json";
import perfilAsset from "../../assets/reichely-perfil.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { generarContenido } from "@/lib/api/generate.functions";
import { useSupabaseAuthReady } from "@/hooks/use-supabase-auth-ready";

export const Route = createFileRoute("/_authenticated/generador")({
  head: () => ({
    meta: [
      { title: "Generador — Vida Emprendedora" },
      { name: "description", content: "Crea contenido con tu voz, guiada por la metodología de Reichely." },
    ],
  }),
  component: GeneradorPage,
});

type Formato = "carrusel" | "reel" | "post" | "stories" | "venta";
type Estilo = "negativo" | "info-secreta" | "controversial";
type Motor = "aspiracion" | "educacion" | "impacto" | "reflejo";

const FORMATOS: { id: Formato; emoji: string; titulo: string; sub: string }[] = [
  { id: "carrusel", emoji: "📊", titulo: "Carrusel", sub: "10 slides posicionados + caption" },
  { id: "reel", emoji: "🎬", titulo: "Reel", sub: "Guion completo + caption" },
  { id: "post", emoji: "📝", titulo: "Post / Caption", sub: "Copy para feed" },
  { id: "stories", emoji: "📱", titulo: "Stories", sub: "Secuencia 4–8 pantallas" },
  { id: "venta", emoji: "💰", titulo: "Venta Sutil", sub: "Sin precio, el cliente inicia" },
];

const ESTILOS: { id: Estilo; emoji: string; titulo: string; sub: string }[] = [
  { id: "negativo", emoji: "⚔️", titulo: "Negativo", sub: "Ataca un error o hábito destructivo y muestra la corrección" },
  { id: "info-secreta", emoji: "🔐", titulo: "Info Secreta", sub: "Revela algo que la audiencia no sabe y le da ventaja" },
  { id: "controversial", emoji: "💥", titulo: "Controversial", sub: "Desafía una creencia común con una postura contraria" },
];

const MOTORES: { id: Motor; emoji: string; titulo: string; sub: string }[] = [
  { id: "aspiracion", emoji: "✨", titulo: "Aspiración", sub: '"Quiero ser o tener esto"' },
  { id: "educacion", emoji: "💡", titulo: "Educación", sub: '"No sabía esto"' },
  { id: "impacto", emoji: "🔥", titulo: "Impacto", sub: '"Esto me afecta directamente"' },
  { id: "reflejo", emoji: "💧", titulo: "Reflejo", sub: '"Esto soy yo"' },
];

export default function GeneradorPage() {
  const navigate = useNavigate();
  const generar = useServerFn(generarContenido);
  const { isReady, user } = useSupabaseAuthReady();

  const [nombre, setNombre] = useState<string>("");
  const [profileReady, setProfileReady] = useState(false);

  const [formato, setFormato] = useState<Formato>("carrusel");
  const [estilo, setEstilo] = useState<Estilo>("negativo");
  const [motor, setMotor] = useState<Motor>("aspiracion");
  const [tema, setTema] = useState("");

  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!isReady) return;

    if (!user) {
      navigate({ to: "/", replace: true });
      return;
    }

    setProfileReady(false);

    void supabase
      .from("perfiles")
      .select("nombre")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data: perfil }) => {
        if (cancelled) return;
        setNombre(perfil?.nombre ?? "");
        setProfileReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, navigate, user]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim()) return;
    setLoading(true);
    setOutput(null);
    setError(null);
    try {
      const res = await generar({ data: { formato, estilo, motor, tema: tema.trim() } });
      setOutput(res.contenido);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Vuelve a intentarlo.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (!isReady || !profileReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src={logoAsset.url} alt="" className="w-8 h-8 object-contain shrink-0 mix-blend-multiply" />
            <span className="text-[11px] sm:text-sm tracking-[0.15em] uppercase text-foreground/80 truncate">Vida Emprendedora</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleLogout}
              className="text-[11px] sm:text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition"
            >
              Salir
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/30 shrink-0">
              <img src={perfilAsset.url} alt="Reichely" className="w-full h-full object-cover object-[50%_28%] scale-[1.22]" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-6 py-10 pb-24">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">Tu estudio de creación</p>
          <h1 className="text-4xl sm:text-5xl serif text-foreground leading-tight">
            {nombre ? <>Hola, {nombre.split(" ")[0]}.<br />¿Qué quieres crear hoy?</> : <>¿Qué quieres<br />crear hoy?</>}
          </h1>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6">
          {/* 1. Formato */}
          <Section label="1. ¿Qué formato necesitas?">
            <div className="grid sm:grid-cols-3 gap-3">
              {FORMATOS.map((f) => (
                <OptionCard
                  key={f.id}
                  selected={formato === f.id}
                  onClick={() => setFormato(f.id)}
                  emoji={f.emoji}
                  titulo={f.titulo}
                  sub={f.sub}
                />
              ))}
            </div>
          </Section>

          {/* 2. Estilo */}
          <Section label="2. ¿Qué estilo de ejecución?">
            <div className="grid sm:grid-cols-3 gap-3">
              {ESTILOS.map((e) => (
                <OptionCard
                  key={e.id}
                  selected={estilo === e.id}
                  onClick={() => setEstilo(e.id)}
                  emoji={e.emoji}
                  titulo={e.titulo}
                  sub={e.sub}
                />
              ))}
            </div>
          </Section>

          {/* 3. Motor viral */}
          <Section label="3. ¿Qué motor viral activas?">
            <div className="grid sm:grid-cols-2 gap-3">
              {MOTORES.map((m) => (
                <OptionCard
                  key={m.id}
                  selected={motor === m.id}
                  onClick={() => setMotor(m.id)}
                  emoji={m.emoji}
                  titulo={m.titulo}
                  sub={m.sub}
                />
              ))}
            </div>
          </Section>

          {/* 4. Tema */}
          <Section label="4. Tema o texto de entrada">
            <textarea
              value={tema}
              onChange={(ev) => setTema(ev.target.value)}
              rows={6}
              placeholder={"Escribe el tema, un insight, o pega el texto que quieres transformar en contenido…\n\nSi usas palabra clave para ManyChat, añádela. Ej: Palabra clave: TUPALABRA"}
              className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition resize-none text-[15px] leading-relaxed"
            />
          </Section>

          <button
            type="submit"
            disabled={loading || !tema.trim()}
            className="w-full py-4 rounded-xl text-primary-foreground font-medium tracking-wide transition-all hover:opacity-95 disabled:opacity-50 shadow-[var(--shadow-soft)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            {loading ? "Creando con alma…" : "Generar contenido"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

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

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-[var(--shadow-card)]">
      <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-4">{label}</h2>
      {children}
    </section>
  );
}

function OptionCard({
  selected,
  onClick,
  emoji,
  titulo,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  emoji: string;
  titulo: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-xl border-2 transition ${
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:border-primary/40"
      }`}
    >
      <div className="text-xl mb-2">{emoji}</div>
      <div className="font-semibold text-foreground text-sm leading-tight">{titulo}</div>
      <div className="text-xs text-muted-foreground mt-1 leading-snug">{sub}</div>
    </button>
  );
}
