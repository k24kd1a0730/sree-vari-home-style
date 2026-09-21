import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { catalogQueryOptions } from "@/lib/catalog.query";
import {
  accentClasses,
  daysLeft,
  formatValidTill,
  offerScopeLabel,
  productsUnderOffer,
} from "@/lib/pricing";

export const Route = createFileRoute("/offers")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(catalogQueryOptions()),
  head: () => ({
    meta: [
      { title: "Live offers — Sree Vari Furnitures" },
      {
        name: "description",
        content:
          "Every offer running at Sree Vari Furnitures right now, with the pieces it covers and the date it ends.",
      },
      { property: "og:title", content: "Live offers — Sree Vari Furnitures" },
      {
        property: "og:description",
        content:
          "See the discounts live today at Sree Vari Furnitures and exactly which pieces they cover.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const { data: catalog } = useSuspenseQuery(catalogQueryOptions());

  return (
    <AppShell active="offers">
      <div className="px-4 pt-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-brass">
          Running now
        </p>
        <h1 className="mt-1 font-display text-[26px] leading-tight text-foreground">
          {catalog.offers.length > 0
            ? `${catalog.offers.length} offer${catalog.offers.length > 1 ? "s" : ""} live`
            : "Offers, straight from the shop"}
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
          {catalog.offers.length > 0
            ? "The discounted price is already on every card — no codes, no waiting."
            : "Nothing is discounted at the moment. The shop posts offers here and on the home screen as soon as they start."}
        </p>
      </div>

      {catalog.offers.length === 0 ? (
        <div className="mx-4 mt-6 rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center">
          <p className="font-display text-[17px] text-foreground">
            No offers running today
          </p>
          <p className="mt-1 text-[12px] text-ink-soft">
            Have a look at the catalogue — the showroom is worth a browse on its own.
          </p>
          <Link
            to="/catalog"
            search={{ q: "", cat: "all", offer: "all" }}
            className="mt-4 inline-flex rounded-full bg-walnut px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-foreground"
          >
            Browse catalogue
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-3 px-4 pb-6">
          {catalog.offers.map((offer, index) => {
            const covered = productsUnderOffer(offer, catalog.products);
            const left = daysLeft(offer.valid_till);
            return (
              <article
                key={offer.id}
                className="animate-sv-rise overflow-hidden rounded-2xl border border-border/70 bg-surface"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex items-start justify-between gap-3 px-4 pt-4">
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2 py-[3px] font-mono text-[10px] font-medium ${accentClasses[offer.accent]}`}
                    >
                      {offer.discount_percent}% OFF
                    </span>
                    <h2 className="mt-2 font-display text-[19px] leading-tight text-foreground">
                      {offer.headline}
                    </h2>
                    <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
                      {offer.description ||
                        offerScopeLabel(offer, catalog.categories, catalog.products)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 px-4 py-2.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
                    {covered.length} {covered.length === 1 ? "piece" : "pieces"}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-brass">
                    <CalendarDays className="h-3 w-3" />
                    till {formatValidTill(offer.valid_till)}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-leaf">
                    {left <= 1 ? "ends today" : `${left} days left`}
                  </span>
                </div>
                <Link
                  to="/catalog"
                  search={{ q: "", cat: "all", offer: offer.id }}
                  className="flex items-center justify-between gap-2 bg-sand px-4 py-3 text-[13px] font-medium text-walnut transition-colors hover:bg-sand-deep"
                >
                  Shop the offer
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
