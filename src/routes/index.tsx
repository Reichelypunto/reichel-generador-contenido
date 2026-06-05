import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import perfilAsset from "../assets/reichely-perfil.png.asset.json";
import firmaAsset from "../assets/reichely-firma-transparent.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuthReady } from "@/hooks/use-supabase-auth-ready";

const PUBLISHED_APP_ORIGIN = "https://reichel-generador-contenido.lovable.app";
const PUBLISHED_APP_HOSTNAME = new URL(PUBLISHED_APP_ORIGIN).hostname;

function getMagicLinkRedirectUrl() {
  if (typeof window === "undefined") {
    return `${PUBLISHED_APP_ORIGIN}/auth/callback`;
  }

  const { origin, hostname } = window.location;
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
  const isPublishedHost = hostname === PUBLISHED_APP_HOSTNAME;

  if (isLocalHost) {
    return `${origin}/auth/callback`;
  }

  return `${isPublishedHost ? origin : PUBLISHED_APP_ORIGIN}/auth/callback`;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Generador de Contenido — Vida Emprendedora" },
      { name: "description", content: "Espacio privado de alumnas de Vida Emprendedora para crear contenido con alma." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { isReady, user } = useSupabaseAuthReady();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && user) {
      navigate({ to: "/generador", replace: true });
    }
  }, [isReady, navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus("sending");

    const emailLimpio = email.trim().toLowerCase();
    const nombreLimpio = nombre.trim();

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: emailLimpio,
      options: {
        data: { nombre: nombreLimpio },
        emailRedirectTo: getMagicLinkRedirectUrl(),
      },
    });

    if (otpError) {
      // Si el correo no está en la lista, el trigger devuelve un mensaje claro
      const msg = otpError.message?.includes("no está autorizado")
        ? "Este correo no está en la lista de alumnas. Escribe a soporte.membresia@reichelypunto.com"
        : otpError.message || "No se pudo enviar el enlace. Intenta de nuevo.";
      setError(msg);
      setStatus("idle");
      return;
    }
    setStatus("sent");
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <FloatingIcons />
      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-32 h-32 rounded-full overflow-hidden mb-6 ring-4 ring-primary/20 shadow-[var(--shadow-soft)] bg-card">
            <img
              src={perfilAsset.url}
              alt="Reichely"
              className="w-full h-full object-cover scale-[1.4] object-[50%_28%]"
            />
          </div>
          <h1 className="text-4xl serif text-foreground leading-tight">
            Tu app para crear<br />contenido sin complicaciones
          </h1>
          <p className="mt-4 text-sm text-muted-foreground font-light max-w-xs">
            Entra con tu correo de alumna y empieza a generar.
          </p>
        </div>

        {status === "sent" ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl serif mb-2">Revisa tu correo</h2>
            <p className="text-sm text-muted-foreground">
              Te hemos enviado un enlace a<br />
              <span className="text-foreground font-medium">{email}</span>
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Haz clic en el enlace desde el mismo dispositivo para entrar.
            </p>
            <button
              onClick={() => { setStatus("idle"); setEmail(""); setNombre(""); }}
              className="mt-6 text-sm text-primary underline-offset-4 hover:underline"
            >
              Usar otro correo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)] space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
                Tu nombre
              </label>
              <input
                id="nombre"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Como quieres que te llame"
                className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
                Tu correo de alumna
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tunombre@email.com"
                className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full py-3.5 rounded-lg text-primary-foreground font-medium tracking-wide transition-all hover:opacity-95 disabled:opacity-60 shadow-[var(--shadow-soft)]"
              style={{ background: "var(--gradient-primary)" }}
            >
              {status === "sending" ? "Enviando enlace…" : "Recibir enlace mágico"}
            </button>
            <p className="mt-2 text-xs text-center text-muted-foreground leading-relaxed">
              Solo alumnas activas tienen acceso.<br />
              ¿Problemas? Escribe a{" "}
              <a href="mailto:soporte.membresia@reichelypunto.com" className="text-primary hover:underline">
                soporte.membresia@reichelypunto.com
              </a>
            </p>
          </form>
        )}

        <footer className="mt-16 flex flex-col items-center gap-3">
          <img
            src={firmaAsset.url}
            alt="Reichely punto 2.0"
            className="h-14 object-contain"
          />
        </footer>
      </div>
    </main>
  );
}

type FloatItem = { icon: string; left: string; delay: string; duration: string; size: string; opacity: number };

const ITEMS: FloatItem[] = [
  { icon: "instagram", left: "8%",  delay: "0s",   duration: "18s", size: "28px", opacity: 0.18 },
  { icon: "heart",     left: "22%", delay: "3s",   duration: "22s", size: "20px", opacity: 0.22 },
  { icon: "phone",     left: "38%", delay: "6s",   duration: "26s", size: "32px", opacity: 0.14 },
  { icon: "heart",     left: "55%", delay: "1.5s", duration: "20s", size: "16px", opacity: 0.25 },
  { icon: "instagram", left: "72%", delay: "8s",   duration: "24s", size: "24px", opacity: 0.16 },
  { icon: "sparkle",   left: "85%", delay: "4s",   duration: "19s", size: "18px", opacity: 0.28 },
  { icon: "heart",     left: "92%", delay: "10s",  duration: "23s", size: "22px", opacity: 0.18 },
  { icon: "sparkle",   left: "15%", delay: "12s",  duration: "21s", size: "14px", opacity: 0.22 },
  { icon: "phone",     left: "65%", delay: "14s",  duration: "27s", size: "26px", opacity: 0.13 },
];

function FloatingIcons() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {ITEMS.map((it, i) => (
        <span
          key={i}
          className="absolute block text-primary"
          style={{
            left: it.left,
            bottom: "-40px",
            width: it.size,
            height: it.size,
            opacity: it.opacity,
            animation: `floatUp ${it.duration} linear ${it.delay} infinite`,
          }}
        >
          <IconGlyph name={it.icon} />
        </span>
      ))}
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-110vh) rotate(20deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function IconGlyph({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24" };
  if (name === "instagram") return (
    <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/></svg>
  );
  if (name === "heart") return (
    <svg {...common} fill="currentColor" stroke="none"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z"/></svg>
  );
  if (name === "phone") return (
    <svg {...common}><rect x="6" y="2" width="12" height="20" rx="3"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
  );
  return (
    <svg {...common} fill="currentColor" stroke="none"><path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2z"/></svg>
  );
}
