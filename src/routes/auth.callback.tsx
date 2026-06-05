import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSupabaseAuthReady } from "@/hooks/use-supabase-auth-ready";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { isReady, user } = useSupabaseAuthReady();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;

    if (user) {
      navigate({ to: "/generador", replace: true });
      return;
    }

    const timer = window.setTimeout(() => {
      setError("No he podido abrir tu sesión todavía. Vuelve a pedir el enlace e inténtalo otra vez.");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [isReady, navigate, user]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl serif text-foreground">Entrando…</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Estoy validando tu acceso para llevarte al generador.
        </p>
        {error && (
          <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}