import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useSupabaseAuthReady } from "@/hooks/use-supabase-auth-ready";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    const hasAccessToken = document.cookie.includes("sb-") || typeof window !== "undefined";

    if (!hasAccessToken) {
      throw redirect({ to: "/" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isReady, user } = useSupabaseAuthReady();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!user) {
    throw redirect({ to: "/" });
  }

  return <Outlet />;
}