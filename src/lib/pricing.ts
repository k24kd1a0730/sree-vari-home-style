/**
 * Client-safe pricing helpers shared by every screen.
 */

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  sort: number;
};

export type ProductRow = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
};

export type OfferAccent = "walnut" | "leaf" | "brass";
export type OfferScope = "all" | "category" | "products";

export type OfferRow = {
  id: string;
  headline: string;
  description: string;
  discount_percent: number;
  valid_from: string;
  valid_till: string;
  applies_to: OfferScope;
  image_url: string | null;
  accent: OfferAccent;
  is_published: boolean;
};

export type LiveOffer = OfferRow & {
  category_ids: string[];
  product_ids: string[];
};

export type Catalog = {
  categories: CategoryRow[];
  products: ProductRow[];
  offers: LiveOffer[];
};

export type PriceInfo = {
  display: number;
  strike: number | null;
  percentOff: number | null;
  offer: LiveOffer | null;
};

/** An offer is live while today falls inside its validity window. */
export function isOfferLive(offer: Pick<OfferRow, "valid_from" | "valid_till">): boolean {
  const today = new Date();
  const from = new Date(`${offer.valid_from}T00:00:00`);
  const till = new Date(`${offer.valid_till}T23:59:59`);
  return today >= from && today <= till;
}

/** The best (deepest) live offer covering this product, if any. */
export function offerForProduct(
  product: ProductRow,
  offers: LiveOffer[],
): LiveOffer | null {
  const covering = offers.filter(
    (offer) =>
      isOfferLive(offer) &&
      (offer.applies_to === "all" ||
        (offer.applies_to === "category" &&
          offer.category_ids.includes(product.category_id)) ||
        (offer.applies_to === "products" && offer.product_ids.includes(product.id))),
  );
  if (covering.length === 0) return null;
  return covering.reduce((best, offer) =>
    offer.discount_percent > best.discount_percent ? offer : best,
  );
}

export function priceForProduct(product: ProductRow, offers: LiveOffer[]): PriceInfo {
  const offer = offerForProduct(product, offers);
  const display = offer
    ? Math.round((product.price * (100 - offer.discount_percent)) / 100)
    : Math.round(product.price);
  const strikeSource = product.original_price ?? product.price;
  const strike = strikeSource > display ? Math.round(strikeSource) : null;
  const percentOff = offer
    ? offer.discount_percent
    : strike
      ? Math.round(((strike - display) / strike) * 100)
      : null;
  return { display, strike, percentOff, offer };
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(value: number): string {
  return inr.format(value);
}

export function formatValidTill(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function daysLeft(validTill: string): number {
  const till = new Date(`${validTill}T23:59:59`).getTime();
  return Math.max(0, Math.ceil((till - Date.now()) / 86_400_000));
}

export function offerScopeLabel(
  offer: LiveOffer,
  categories: CategoryRow[],
  products: ProductRow[],
): string {
  if (offer.applies_to === "all") return "Every piece in the showroom";
  if (offer.applies_to === "category") {
    const names = categories
      .filter((category) => offer.category_ids.includes(category.id))
      .map((category) => category.name);
    return names.length > 0 ? names.join(" + ") : "Selected collections";
  }
  const names = products
    .filter((product) => offer.product_ids.includes(product.id))
    .map((product) => product.name);
  return names.length > 0 ? names.join(", ") : "Selected pieces";
}

export function productsUnderOffer(
  offer: LiveOffer,
  products: ProductRow[],
): ProductRow[] {
  return products.filter((product) => {
    if (offer.applies_to === "all") return true;
    if (offer.applies_to === "category")
      return offer.category_ids.includes(product.category_id);
    return offer.product_ids.includes(product.id);
  });
}

/** Solid chip styles used on offer cards and badges. */
export const accentClasses: Record<OfferAccent, string> = {
  walnut: "bg-walnut text-walnut-foreground",
  leaf: "bg-leaf text-leaf-foreground",
  brass: "bg-brass text-brass-foreground",
};

/** Tinted panel styles used behind offer terms and metadata. */
export const accentSoftClasses: Record<OfferAccent, string> = {
  walnut: "bg-walnut/10 text-walnut",
  leaf: "bg-leaf/10 text-leaf",
  brass: "bg-brass/15 text-brass",
};
