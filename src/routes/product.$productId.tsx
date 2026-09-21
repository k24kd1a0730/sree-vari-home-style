import { useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
} from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, ChevronRight, Tag } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { catalogQueryOptions } from "@/lib/catalog.query";
import {
  accentSoftClasses,
  daysLeft,
  formatINR,
  formatValidTill,
  offerScopeLabel,
  priceForProduct,
} from "@/lib/pricing";
import { resolveImage } from "@/lib/images";

export const Route = createFileRoute("/product/$productId")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(catalogQueryOptions()),
  head: () => ({
    meta: [
      { title: "Piece details — Sree Vari Furnitures" },
      {
        name: "description",
        content:
          "Dimensions, materials and today's price for this piece from the Sree Vari Furnitures showroom.",
      },
      { property: "og:title", content: "Sree Vari Furnitures" },
      {
        property: "og:description",
        content:
          "Teak and rosewood furniture, built to last — see the price and any offer running on this piece.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  notFoundComponent: ProductNotFound,
  component: ProductPage,
});

function ProductNotFound() {
  return (
    <AppShell active="catalog">
      <div className="px-4 pt-16 text-center">
        <p className="font-display text-[22px] text-foreground">
          We can&apos;t find that piece
        </p>
        <p className="mt-1.5 text-[13px] text-ink-soft">
          It may have left the showroom. The rest of the catalogue is still here.
        </p>
        <Link
          to="/catalog"
          search={{ q: "", cat: "all", offer: "all" }}
          className="mt-5 inline-flex rounded-full bg-walnut px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-foreground"
        >
          Back to catalogue
        </Link>
      </div>
    </AppShell>
  );
}

function ProductPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const { data: catalog } = useSuspenseQuery(catalogQueryOptions());

  const product = catalog.products.find((item) => item.id === productId);
  if (!product) throw notFound();

  const price = priceForProduct(product, catalog.offers);
  const image = resolveImage(product.image_url);
  const category = catalog.categories.find(
    (item) => item.id === product.category_id,
  );
  const offer = price.offer;
  const saving = price.strike != null ? price.strike - price.display : 0;

  useEffect(() => {
    document.title = `${product.name} — Sree Vari Furnitures`;
  }, [product.name]);

  const related = catalog.products
    .filter((item) => item.category_id === product.category_id && item.id !== product.id)
    .slice(0, 4);

  return (
    <AppShell active="catalog">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 pt-3">
          <button
            type="button"
            onClick={() =>
              navigate({
                to: "/catalog",
                search: { q: "", cat: category?.id ?? "all", offer: "all" },
              })
            }
            aria-label="Back to catalogue"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/90 text-foreground backdrop-blur"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {price.percentOff != null && price.percentOff > 0 && (
            <span className="rounded-full bg-leaf px-2.5 py-1 font-mono text-[10px] font-medium text-leaf-foreground shadow-sm">
              −{price.percentOff}%
            </span>
          )}
        </div>
        <div className="aspect-4/5 w-full overflow-hidden bg-sand">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-sand" />
          )}
        </div>
      </div>

      <div className="animate-sv-rise px-4 pt-4">
        {category && (
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brass">
            {category.name}
          </p>
        )}
        <h1 className="mt-1 font-display text-[24px] leading-tight text-foreground">
          {product.name}
        </h1>

        <div className="mt-3 flex items-end gap-3">
          <span className="font-display text-[26px] leading-none text-foreground">
            {formatINR(price.display)}
          </span>
          {price.strike != null && (
            <span className="pb-0.5 text-[13px] text-ink-soft line-through">
              {formatINR(price.strike)}
            </span>
          )}
        </div>
        {saving > 0 && (
          <p className="mt-1.5 text-[12px] text-leaf">
            You save {formatINR(saving)} on this piece
          </p>
        )}

        {offer ? (
          <section
            className={`mt-4 rounded-2xl px-4 py-3.5 ${accentSoftClasses[offer.accent]}`}
          >
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5" />
              <p className="font-mono text-[9px] uppercase tracking-[0.18em]">
                Offer applied · {offer.discount_percent}% off
              </p>
            </div>
            <h2 className="mt-1.5 font-display text-[17px] leading-snug">
              {offer.headline}
            </h2>
            {offer.description && (
              <p className="mt-1 text-[12px] leading-relaxed opacity-90">
                {offer.description}
              </p>
            )}
            <dl className="mt-3 space-y-1.5 border-t border-current/15 pt-2.5 text-[12px]">
              <div className="flex justify-between gap-3">
                <dt className="opacity-70">Applies to</dt>
                <dd className="text-right">
                  {offerScopeLabel(offer, catalog.categories, catalog.products)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="opacity-70">Valid till</dt>
                <dd className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatValidTill(offer.valid_till)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="opacity-70">Ends</dt>
                <dd>
                  {daysLeft(offer.valid_till) <= 1
                    ? "today"
                    : `in ${daysLeft(offer.valid_till)} days`}
                </dd>
              </div>
            </dl>
          </section>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-border bg-surface px-4 py-3 text-[12px] text-ink-soft">
            No offer is running on this piece right now. The listed price is the
            price you pay.
          </p>
        )}

        <section className="mt-5">
          <h2 className="font-display text-[17px] text-foreground">
            About this piece
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
            {product.description}
          </p>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-6 px-4 pb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[17px] text-foreground">
              More from {category?.name ?? "the showroom"}
            </h2>
            <Link
              to="/catalog"
              search={{ q: "", cat: product.category_id, offer: "all" }}
              className="inline-flex items-center gap-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-primary"
            >
              See all
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {related.map((item, index) => (
              <ProductCard
                key={item.id}
                product={item}
                offers={catalog.offers}
                index={index}
                categoryName={category?.name}
              />
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
