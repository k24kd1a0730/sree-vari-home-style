import { Link } from "@tanstack/react-router";
import type { LiveOffer, ProductRow } from "@/lib/pricing";
import { priceForProduct, formatINR } from "@/lib/pricing";
import { resolveImage } from "@/lib/images";

export function ProductCard({
  product,
  offers,
  categoryName,
  index = 0,
}: {
  product: ProductRow;
  offers: LiveOffer[];
  categoryName?: string | undefined;
  index?: number;
}) {
  const price = priceForProduct(product, offers);
  const image = resolveImage(product.image_url);

  return (
    <Link
      to="/product/$productId"
      params={{ productId: product.id }}
      className="group block animate-sv-rise overflow-hidden rounded-2xl border border-border/70 bg-surface transition-shadow hover:shadow-[0_14px_34px_-18px_color-mix(in_oklab,var(--color-walnut)_45%,transparent)]"
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      <div className="relative aspect-square overflow-hidden bg-sand">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-sand" />
        )}
        {price.percentOff != null && price.percentOff > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-leaf px-2 py-[3px] font-mono text-[10px] font-medium tracking-tight text-leaf-foreground shadow-sm">
            −{price.percentOff}%
          </span>
        )}
      </div>
      <div className="px-3 pt-2.5 pb-3">
        {categoryName && (
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
            {categoryName}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 font-display text-[15px] leading-snug text-foreground">
          {product.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            {formatINR(price.display)}
          </span>
          {price.strike != null && (
            <span className="text-[11px] text-ink-soft line-through">
              {formatINR(price.strike)}
            </span>
          )}
        </div>
        {price.offer && (
          <p className="mt-1.5 line-clamp-1 text-[11px] text-brass">
            {price.offer.headline}
          </p>
        )}
      </div>
    </Link>
  );
}
