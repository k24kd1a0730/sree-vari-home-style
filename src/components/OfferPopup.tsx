import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import type { CategoryRow, LiveOffer, ProductRow } from "@/lib/pricing";
import {
  accentClasses,
  daysLeft,
  formatValidTill,
  offerScopeLabel,
  productsUnderOffer,
} from "@/lib/pricing";
import { resolveImage } from "@/lib/images";

const SEEN_KEY = "sree-vari-seen-offers";

function readSeen(): string[] {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/**
 * The offer popup: shows the newest live offer once per device. "Don't show
 * again" is remembered locally, closing just this offer.
 */
export function OfferPopup({
  offers,
  categories,
  products,
}: {
  offers: LiveOffer[];
  categories: CategoryRow[];
  products: ProductRow[];
}) {
  const [offer, setOffer] = useState<LiveOffer | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (offers.length === 0) return;
    const newest = offers[0];
    if (!newest) return;
    if (readSeen().includes(newest.id)) return;
    setOffer(newest);
    setOpen(true);
  }, [offers]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const hideForever = useCallback(() => {
    if (offer) {
      try {
        const seen = new Set([...readSeen(), offer.id]);
        window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
      } catch {
        /* private mode — the popup simply returns next visit */
      }
    }
    setOpen(false);
  }, [offer]);

  if (!open || !offer) return null;

  const image = resolveImage(offer.image_url);
  const covered = productsUnderOffer(offer, products);
  const left = daysLeft(offer.valid_till);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={offer.headline}
      className="fixed inset-0 z-50 flex items-end justify-center"
    >
      <button
        type="button"
        aria-label="Close offer"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-walnut/45 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-[420px] animate-sv-pop overflow-hidden rounded-t-3xl border-t border-border bg-surface shadow-[0_-20px_60px_-20px_color-mix(in_oklab,var(--color-walnut)_45%,transparent)]">
        <div className="relative h-[150px] bg-sand">
          {image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-walnut/85 to-walnut" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-walnut/80 via-walnut/15 to-transparent" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close offer"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-background/85 text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="absolute left-4 top-4">
            <span
              className={`inline-flex rounded-full px-2 py-1 font-mono text-[10px] font-medium ${accentClasses[offer.accent]}`}
            >
              {offer.discount_percent}% OFF
            </span>
          </div>
          <div className="absolute inset-x-4 bottom-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-background/80">
              Offer from the shop
            </p>
            <h2 className="mt-1 font-display text-[22px] leading-tight text-background">
              {offer.headline}
            </h2>
          </div>
        </div>

        <div className="px-4 pt-3.5 pb-5">
          <p className="text-[13px] leading-relaxed text-ink-soft">
            {offer.description ||
              `Applied across ${offerScopeLabel(offer, categories, products)}.`}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
            <span className="text-brass">
              {covered.length} {covered.length === 1 ? "piece" : "pieces"}
            </span>
            <span>till {formatValidTill(offer.valid_till)}</span>
            <span className="text-leaf">
              {left <= 1 ? "ends today" : `${left} days left`}
            </span>
          </div>

          <Link
            to="/catalog"
            search={{ q: "", cat: "all", offer: offer.id }}
            onClick={() => setOpen(false)}
            className="mt-4 flex w-full items-center justify-center rounded-full bg-walnut py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-walnut-foreground transition-colors hover:bg-walnut/90"
          >
            Shop this offer
          </Link>
          <button
            type="button"
            onClick={hideForever}
            className="mt-2 w-full py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-foreground"
          >
            Don&apos;t show this again
          </button>
        </div>
      </div>
    </div>
  );
}
