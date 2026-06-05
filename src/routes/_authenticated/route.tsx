import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSupabaseAuthReady } from "@/hooks/use-supabase-auth-ready";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { isReady, user } = useSupabaseAuthReady();

  useEffect(() => {
    if (isReady && !user) {
      navigate({ to: "/", replace: true });
    }
  }, [isReady, navigate, user]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <Outlet />;
}