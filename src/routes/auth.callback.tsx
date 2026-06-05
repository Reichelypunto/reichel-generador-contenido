import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const waitForSession = async () => {
      for (let intento = 0; intento < 14; intento += 1) {
        const { data, error } = await supabase.auth.getUser();

        if (cancelled) return;

        if (!error && data.user) {
          navigate({ to: "/generador", replace: true });
          return;
        }

        await new Promise<void>((resolve) => {
          timer = setTimeout(resolve, intento < 3 ? 400 : 800);
        });
      }

      if (!cancelled) {
        setError("No he podido abrir tu sesión todavía. Vuelve a pedir el enlace e inténtalo otra vez.");
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        navigate({ to: "/generador", replace: true });
      }
    });

    void waitForSession();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

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