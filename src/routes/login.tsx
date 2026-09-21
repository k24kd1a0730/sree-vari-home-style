import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { getOwnerSetupStatus, setupOwner } from "@/lib/catalog.functions";

export const Route = createFileRoute("/login")({
  // The screen's content depends on whether the shop has claimed its login yet,
  // which is backend state the server render can't know for this visitor.
  ssr: false,
  loader: () => getOwnerSetupStatus(),
  head: () => ({
    meta: [
      { title: "Owner sign in — Sree Vari Furnitures" },
      {
        name: "description",
        content:
          "Sign in to Sree Vari Furnitures to post offers and manage what the showroom is showing.",
      },
      {
        property: "og:title",
        content: "Owner sign in — Sree Vari Furnitures",
      },
      {
        property: "og:description",
        content:
          "The owner area for Sree Vari Furnitures — post offers, choose what they cover, publish them.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const setup = Route.useLoaderData().ownerExists === false;
  const navigate = useNavigate();
  const createOwner = useServerFn(setupOwner);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (setup) {
        await createOwner({ data: { email, password } });
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);
      toast.success(setup ? "Owner login created" : "Signed in");
      void navigate({ to: "/owner" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not sign you in just now",
      );
    } finally {
      setBusy(false);
    }
  }

  // This screen is browser-only (ssr: false), so render nothing on the first
  // client paint to match what the server sent, then reveal the form.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-sand-deep/50 sm:py-6">
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center bg-background px-5 py-10 shadow-[0_0_0_1px_var(--color-border),0_24px_60px_-24px_color-mix(in_oklab,var(--color-walnut)_35%,transparent)] sm:min-h-[calc(100vh-3rem)] sm:rounded-3xl">
        <div className="text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-brass">
            Sree Vari Furnitures
          </p>
          <h1 className="mt-2 font-display text-[26px] leading-tight text-foreground">
            {setup ? "Create the owner login" : "Owner sign in"}
          </h1>
          <p className="mx-auto mt-2 max-w-[300px] text-[13px] leading-relaxed text-ink-soft">
            {setup
              ? "This first login belongs to the shop and can't be created twice. Use an email you can access."
              : "Sign in to post offers and decide what the showroom is showing."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-3">
          <label className="block">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="shop@example.com"
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[14px] text-foreground focus:border-walnut/50 focus:outline-none focus:ring-2 focus:ring-walnut/15"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
              Password
            </span>
            <input
              type="password"
              required
              minLength={setup ? 8 : 6}
              autoComplete={setup ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={setup ? "At least 8 characters" : "Your password"}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[14px] text-foreground focus:border-walnut/50 focus:outline-none focus:ring-2 focus:ring-walnut/15"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-walnut py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-walnut-foreground transition-colors hover:bg-walnut/90 disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" />
            {busy ? "Working…" : setup ? "Create login & sign in" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 flex items-start gap-2 rounded-xl bg-sand px-3.5 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />
          <p className="text-[11px] leading-relaxed text-ink-soft">
            {setup
              ? "Once this login exists, the create form disappears and only someone the shop has approved can post offers."
              : "Offers you publish appear on the home screen straight away. Customers never see this area."}
          </p>
        </div>

        <Link
          to="/"
          className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:text-primary/80"
        >
          Back to the showroom
        </Link>
      </div>
    </div>
  );
}
