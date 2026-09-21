// Pathless layout that gates the owner area. The session lives in browser
// storage, so this subtree is client-only (ssr: false) to avoid redirect loops
// on hard refresh.
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  // Required: the owner screen renders here.
  return <Outlet />;
}
