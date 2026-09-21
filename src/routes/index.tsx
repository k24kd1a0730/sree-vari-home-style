import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { CategoryChips, SectionHeading } from "@/components/CategoryChips";
import { OfferCarousel } from "@/components/OfferCarousel";
import { OfferPopup } from "@/components/OfferPopup";
import { ProductCard } from "@/components/ProductCard";
import { catalogQueryOptions } from "@/lib/catalog.query";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(catalogQueryOptions()),
  head: () => ({
    meta: [
      { title: "Sree Vari Furnitures — Offers & Catalogue" },
      {
        name: "description",
        content:
          "See today's offers from Sree Vari Furnitures and browse the full catalogue of teak and rosewood furniture.",
      },
      {
        property: "og:title",
        content: "Sree Vari Furnitures — Offers & Catalogue",
      },
      {
        property: "og:description",
        content:
          "Offers straight from the shop, applied to the price you see. Browse sofas, dining, bedroom and storage.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { data: catalog } = useSuspenseQuery(catalogQueryOptions());
  const featured = catalog.products.slice(0, 6);

  return (
    <AppShell active="home">
      <OfferPopup
        offers={catalog.offers}
        categories={catalog.categories}
        products={catalog.products}
      />

      <OfferCarousel
        offers={catalog.offers}
        categories={catalog.categories}
        products={catalog.products}
      />

      <section className="px-4 pt-6">
        <SectionHeading
          eyebrow="The showroom"
          title="Browse by room"
          action={{
            label: "See all",
            to: "/catalog",
            search: { q: "", cat: "all", offer: "all" },
          }}
        />
        <div className="mt-3">
          <CategoryChips
            categories={catalog.categories}
            active="all"
            onSelect={(id) =>
              void navigate({
                to: "/catalog",
                search: { q: "", cat: id, offer: "all" },
              })
            }
          />
        </div>
      </section>

      <section className="px-4 pt-7">
        <SectionHeading
          eyebrow="In the showroom"
          title="Fresh pieces"
          action={{
            label: "Catalogue",
            to: "/catalog",
            search: { q: "", cat: "all", offer: "all" },
          }}
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
          {featured.map((product, index) => (
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
      </section>

      <section className="px-4 pt-7 pb-6">
        <div className="rounded-2xl border border-border/70 bg-sand px-4 py-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brass">
            How pricing works here
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-foreground">
            Every offer the shop posts is applied to the price you see on the
            card — no codes, no minimums, nothing to ask for at the counter. When
            an offer ends, the card quietly goes back to its regular price.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
