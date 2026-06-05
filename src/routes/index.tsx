import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import perfilAsset from "../assets/reichely-perfil.png.asset.json";
import firmaAsset from "../assets/reichely-firma.png.asset.json";

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
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "denied">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    // Mock: simulate magic link send (replaced by Supabase in Phase 2)
    setTimeout(() => setStatus("sent"), 900);
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
              Te hemos enviado un enlace mágico a<br />
              <span className="text-foreground font-medium">{email}</span>
            </p>
            <button
              onClick={() => { setStatus("idle"); setEmail(""); }}
              className="mt-6 text-sm text-primary underline-offset-4 hover:underline"
            >
              Usar otro correo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
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
            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-5 w-full py-3.5 rounded-lg text-primary-foreground font-medium tracking-wide transition-all hover:opacity-95 disabled:opacity-60 shadow-[var(--shadow-soft)]"
              style={{ background: "var(--gradient-primary)" }}
            >
              {status === "sending" ? "Enviando enlace…" : "Recibir enlace mágico"}
            </button>
            <p className="mt-6 text-xs text-center text-muted-foreground leading-relaxed">
              Solo alumnas activas tienen acceso.<br />
              ¿Problemas? Escribe a{" "}
              <a href="mailto:soporte.membresia@reichelypunto.com" className="text-primary hover:underline">
                soporte.membresia@reichelypunto.com
              </a>
            </p>
          </form>
        )}

        {/* Preview link to generator (remove when auth is wired) */}
        <div className="mt-8 text-center">
          <Link to="/generador" className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition">
            Ver demo del generador →
          </Link>
        </div>

        <footer className="mt-16 flex flex-col items-center gap-3">
          <img
            src={firmaAsset.url}
            alt="Reichely punto 2.0"
            className="h-12 object-contain"
            style={{ mixBlendMode: "multiply" }}
          />
        </footer>
      </div>
    </main>
  );
}
