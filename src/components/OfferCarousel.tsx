import { Link } from "@tanstack/react-router";
import type { CategoryRow, LiveOffer, ProductRow } from "@/lib/pricing";
import {
  accentClasses,
  daysLeft,
  formatValidTill,
  offerScopeLabel,
  productsUnderOffer,
} from "@/lib/pricing";
import { resolveImage } from "@/lib/images";

/**
 * The live offer strip at the top of the home screen: swipeable, snap-aligned
 * cards, one per offer the owner has published.
 */
export function OfferCarousel({
  offers,
  categories,
  products,
}: {
  offers: LiveOffer[];
  categories: CategoryRow[];
  products: ProductRow[];
}) {
  if (offers.length === 0) {
    return (
      <div className="mx-4 mt-4 rounded-2xl border border-dashed border-border bg-surface px-4 py-6 text-center">
        <p className="font-display text-[16px] text-foreground">
          No offers running right now
        </p>
        <p className="mt-1 text-[12px] text-ink-soft">
          Browse the catalogue — new offers appear here the moment they go live.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Current offers" className="pt-4">
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {offers.map((offer, index) => {
          const image = resolveImage(offer.image_url);
          const count = productsUnderOffer(offer, products).length;
          const left = daysLeft(offer.valid_till);
          return (
            <Link
              key={offer.id}
              to="/catalog"
              search={{ q: "", cat: "all", offer: offer.id }}
              className="relative w-[86%] shrink-0 snap-center animate-sv-pop overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-[0_16px_40px_-26px_color-mix(in_oklab,var(--color-walnut)_50%,transparent)]"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="relative h-[132px] overflow-hidden bg-sand">
                {image ? (
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-walnut/85 to-walnut" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-walnut/75 via-walnut/10 to-transparent" />
                <div className="absolute left-3 top-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[10px] font-medium tracking-tight ${accentClasses[offer.accent]}`}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inset-0 animate-sv-breathe rounded-full bg-current" />
                      <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
                    </span>
                    {offer.discount_percent}% OFF
                  </span>
                </div>
                <div className="absolute inset-x-3 bottom-2.5">
                  <h3 className="line-clamp-1 font-display text-[18px] leading-tight text-background">
                    {offer.headline}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 font-mono text-[9px] uppercase tracking-[0.16em] text-background/80">
                    {offerScopeLabel(offer, categories, products)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <span className="text-[12px] text-ink-soft">
                  {count} {count === 1 ? "piece" : "pieces"} included
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-brass">
                  {left <= 1 ? "Ends today" : `${left} days left`} · till{" "}
                  {formatValidTill(offer.valid_till)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
