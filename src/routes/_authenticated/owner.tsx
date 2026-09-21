import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { OwnerOfferForm } from "@/components/OwnerOfferForm";
import {
  deleteOffer,
  getOwnerDashboard,
  setOfferPublished,
} from "@/lib/catalog.functions";
import {
  daysLeft,
  formatValidTill,
  isOfferLive,
  offerScopeLabel,
  productsUnderOffer,
  type LiveOffer,
} from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/owner")({
  head: () => ({
    meta: [
      { title: "Owner — Sree Vari Furnitures" },
      {
        name: "description",
        content:
          "Post offers, choose what they cover, and publish them to the Sree Vari Furnitures showroom.",
      },
      { property: "og:title", content: "Owner — Sree Vari Furnitures" },
      {
        property: "og:description",
        content: "The offer desk for Sree Vari Furnitures.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OwnerPage,
});

type OfferState = "live" | "draft" | "scheduled" | "ended";

function stateOf(offer: {
  valid_from: string;
  valid_till: string;
  is_published: boolean;
}): OfferState {
  const now = new Date();
  if (now < new Date(`${offer.valid_from}T00:00:00`)) return "scheduled";
  if (!isOfferLive(offer)) return "ended";
  return offer.is_published ? "live" : "draft";
}

const STATE_CLASS: Record<OfferState, string> = {
  live: "bg-leaf text-leaf-foreground",
  draft: "bg-sand-deep text-walnut",
  scheduled: "bg-brass/20 text-brass",
  ended: "bg-muted text-ink-soft",
};

function OwnerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchDashboard = useServerFn(getOwnerDashboard);
  const togglePublished = useServerFn(setOfferPublished);
  const remove = useServerFn(deleteOffer);
  const [email, setEmail] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["owner-dashboard"],
    queryFn: () => fetchDashboard(),
  });

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: session }) => {
      setEmail(session.user?.email ?? null);
    });
  }, []);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["owner-dashboard"] });

  async function onToggle(offer: LiveOffer & { is_published: boolean }) {
    setBusyId(offer.id);
    try {
      await togglePublished({
        data: { id: offer.id, is_published: !offer.is_published },
      });
      toast.success(offer.is_published ? "Offer hidden" : "Offer published");
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the offer");
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(id: string) {
    setBusyId(id);
    try {
      await remove({ data: { id } });
      toast.success("Offer deleted");
      setConfirmDelete(null);
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the offer");
    } finally {
      setBusyId(null);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  }

  const liveCount = data?.offers.filter((offer) => stateOf(offer) === "live").length ?? 0;

  return (
    <AppShell active="owner">
      <div className="px-4 pt-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-brass">
          Owner desk
        </p>
        <h1 className="mt-1 font-display text-[24px] leading-tight text-foreground">
          Offers
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
          {email ?? "Signed in"} · {liveCount} live right now
        </p>
      </div>

      {isPending && (
        <div className="mt-10 flex items-center justify-center gap-2 text-ink-soft">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-[13px]">Loading the shop&hellip;</span>
        </div>
      )}

      {error && (
        <div className="mx-4 mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-center">
          <p className="text-[13px] text-foreground">
            This area is for the shop owner only.
          </p>
          <p className="mt-1 text-[12px] text-ink-soft">
            {error instanceof Error ? error.message : "Please sign in again."}
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-full bg-walnut px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-foreground"
            >
              Try again
            </button>
            <Link
              to="/login"
              className="rounded-full border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}

      {data && (
        <>
          <div className="mt-5 px-4">
            <OwnerOfferForm
              categories={data.categories}
              products={data.products}
              onCreated={refresh}
            />
          </div>

          <section className="mt-6 px-4 pb-6">
            <h2 className="font-display text-[17px] text-foreground">
              All offers ({data.offers.length})
            </h2>
            {data.offers.length === 0 ? (
              <p className="mt-2 rounded-2xl border border-dashed border-border bg-surface px-4 py-6 text-center text-[12px] text-ink-soft">
                Nothing posted yet. Use the form above to put your first offer on
                the home screen.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {data.offers.map((offer) => {
                  const state = stateOf(offer);
                  const covered = productsUnderOffer(offer, data.products);
                  return (
                    <li
                      key={offer.id}
                      className="animate-sv-rise rounded-2xl border border-border/70 bg-surface px-4 py-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.12em] ${STATE_CLASS[state]}`}
                            >
                              {state}
                            </span>
                            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-brass">
                              {offer.discount_percent}% off
                            </span>
                          </div>
                          <h3 className="mt-1.5 truncate font-display text-[16px] text-foreground">
                            {offer.headline}
                          </h3>
                          <p className="mt-1 text-[11px] text-ink-soft">
                            {offerScopeLabel(offer, data.categories, data.products)} ·{" "}
                            {covered.length} {covered.length === 1 ? "piece" : "pieces"}
                          </p>
                          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
                            till {formatValidTill(offer.valid_till)}
                            {state === "live" && daysLeft(offer.valid_till) <= 3
                              ? ` · ${daysLeft(offer.valid_till) <= 1 ? "ends today" : `${daysLeft(offer.valid_till)} days left`}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-2.5">
                        <button
                          type="button"
                          onClick={() => void onToggle(offer)}
                          disabled={busyId === offer.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-accent disabled:opacity-60"
                        >
                          {offer.is_published ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                          {offer.is_published ? "Hide" : "Publish"}
                        </button>
                        {confirmDelete === offer.id ? (
                          <span className="ml-auto flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void onDelete(offer.id)}
                              disabled={busyId === offer.id}
                              className="rounded-full bg-destructive px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-destructive-foreground disabled:opacity-60"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(null)}
                              className="rounded-full border border-border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft"
                            >
                              Keep
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(offer.id)}
                            aria-label={`Delete ${offer.headline}`}
                            className="ml-auto flex h-7 w-7 items-center justify-center rounded-full border border-border text-ink-soft transition-colors hover:border-destructive/40 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}

      <div className="px-4 pb-6">
        <div className="flex items-center gap-2 rounded-2xl bg-sand px-4 py-3">
          <KeyRound className="h-4 w-4 shrink-0 text-walnut" />
          <p className="flex-1 text-[11px] leading-relaxed text-ink-soft">
            Offers appear on the customer home screen as soon as they are
            published, and drop off by themselves when the end date passes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-accent"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </AppShell>
  );
}
