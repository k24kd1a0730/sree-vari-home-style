import { useEffect, useMemo, useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CategoryChips } from "@/components/CategoryChips";
import { ProductCard } from "@/components/ProductCard";
import { catalogQueryOptions } from "@/lib/catalog.query";
import {
  formatValidTill,
  productsUnderOffer,
  type LiveOffer,
  type ProductRow,
} from "@/lib/pricing";

const catalogSearch = z.object({
  q: z.string().default(""),
  cat: z.string().default("all"),
  offer: z.string().default("all"),
});

type Filters = { q: string; cat: string; offer: string };

export const Route = createFileRoute("/catalog")({
  validateSearch: (search) => catalogSearch.parse(search),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(catalogQueryOptions()),
  head: () => ({
    meta: [
      { title: "Catalogue — Sree Vari Furnitures" },
      {
        name: "description",
        content:
          "Browse every piece in the Sree Vari Furnitures showroom by room, search or live offer.",
      },
      { property: "og:title", content: "Catalogue — Sree Vari Furnitures" },
      {
        property: "og:description",
        content:
          "Sofas, dining tables, beds and storage in teak and rosewood — filter by room or by the offer running today.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const { q, cat, offer } = Route.useSearch();
  const navigate = useNavigate();
  const { data: catalog } = useSuspenseQuery(catalogQueryOptions());
  const [term, setTerm] = useState(q);

  useEffect(() => {
    setTerm(q);
  }, [q]);

  useEffect(() => {
    if (term === q) return;
    const id = setTimeout(() => {
      void navigate({
        to: "/catalog",
        search: { q: term, cat, offer },
        replace: true,
      });
    }, 220);
    return () => clearTimeout(id);
  }, [term, q, cat, offer, navigate]);

  const go = (next: Partial<Filters>) => {
    void navigate({
      to: "/catalog",
      search: { q, cat, offer, ...next },
      replace: true,
    });
  };

  const activeOffer: LiveOffer | null =
    offer === "all"
      ? (null satisfies LiveOffer | null)
      : (catalog.offers.find((item) => item.id === offer) ?? null);

  const visible = useMemo(
    () =>
      catalog.products.filter((product: ProductRow) => {
        if (cat !== "all" && product.category_id !== cat) return false;
        if (activeOffer && productsUnderOffer(activeOffer, [product]).length === 0) {
          return false;
        }
        const needle = term.trim().toLowerCase();
        if (!needle) return true;
        return (
          product.name.toLowerCase().includes(needle) ||
          product.description.toLowerCase().includes(needle)
        );
      }),
    [catalog.products, cat, activeOffer, term],
  );

  const hasFilters = cat !== "all" || offer !== "all" || q.trim() !== "";

  const clearAll = () => {
    setTerm("");
    void navigate({
      to: "/catalog",
      search: { q: "", cat: "all", offer: "all" },
      replace: true,
    });
  };

  return (
    <AppShell active="catalog">
      <div className="sticky top-[57px] z-20 space-y-3 border-b border-border/60 bg-background/95 px-4 pt-3 pb-3 backdrop-blur">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search sofas, teak, storage…"
            aria-label="Search the catalogue"
            className="w-full rounded-full border border-border bg-surface py-2.5 pl-9 pr-9 text-[14px] text-foreground placeholder:text-ink-soft/70 focus:border-walnut/50 focus:outline-none focus:ring-2 focus:ring-walnut/15"
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-soft hover:bg-accent"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <CategoryChips
          categories={catalog.categories}
          active={cat}
          onSelect={(id) => go({ cat: id })}
        />

        {catalog.offers.length > 0 && (
          <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4">
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-brass" />
            <button
              type="button"
              onClick={() => go({ offer: "all" })}
              aria-pressed={offer === "all"}
              className={`shrink-0 rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
                offer === "all"
                  ? "border-transparent bg-brass text-brass-foreground"
                  : "border-border bg-surface text-ink-soft hover:text-foreground"
              }`}
            >
              All prices
            </button>
            {catalog.offers.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => go({ offer: item.id })}
                aria-pressed={offer === item.id}
                className={`shrink-0 rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
                  offer === item.id
                    ? "border-transparent bg-brass text-brass-foreground"
                    : "border-border bg-surface text-ink-soft hover:text-foreground"
                }`}
              >
                {item.discount_percent}% · {item.headline}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
            {visible.length} {visible.length === 1 ? "piece" : "pieces"}
            {activeOffer ? ` in ${activeOffer.headline}` : ""}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:text-primary/80"
            >
              Clear
            </button>
          )}
        </div>

        {activeOffer && (
          <p className="mt-2 rounded-xl bg-brass/15 px-3 py-2 text-[12px] text-walnut">
            {activeOffer.discount_percent}% off until{" "}
            {formatValidTill(activeOffer.valid_till)} — already applied to the price
            you see.
          </p>
        )}

        {visible.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center">
            <p className="font-display text-[17px] text-foreground">
              Nothing matches those filters
            </p>
            <p className="mt-1 text-[12px] text-ink-soft">
              Try another room, or clear the filters to see the whole showroom.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-4 rounded-full bg-walnut px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-foreground"
            >
              Show everything
            </button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 pb-6">
            {visible.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                offers={catalog.offers}
                index={index}
                categoryName={
                  catalog.categories.find(
                    (category) => category.id === product.category_id,
                  )?.name
                }
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
