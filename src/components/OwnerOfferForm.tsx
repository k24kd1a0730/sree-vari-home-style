import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, Plus, Tag, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { createOffer, type offerInput } from "@/lib/catalog.functions";
import { accentClasses, type CategoryRow, type ProductRow } from "@/lib/pricing";

type AppliesTo = "all" | "category" | "products";
type Accent = "walnut" | "leaf" | "brass";

const SCOPES: { id: AppliesTo; label: string; hint: string }[] = [
  { id: "all", label: "Everything", hint: "Every piece in the showroom" },
  { id: "category", label: "Rooms", hint: "Pick one or more rooms" },
  { id: "products", label: "Pieces", hint: "Pick specific pieces" },
];

function defaultEndsIn() {
  return new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
}

/** The owner's offer composer: what goes on the home screen, and what it covers. */
export function OwnerOfferForm({
  categories,
  products,
  onCreated,
}: {
  categories: CategoryRow[];
  products: ProductRow[];
  onCreated: () => void;
}) {
  const create = useServerFn(createOffer);
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState("15");
  const [validTill, setValidTill] = useState(defaultEndsIn);
  const [appliesTo, setAppliesTo] = useState<AppliesTo>("all");
  const [accent, setAccent] = useState<Accent>("walnut");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const coveredCount = useMemo(() => {
    if (appliesTo === "all") return products.length;
    if (appliesTo === "category") {
      return products.filter((product) =>
        categoryIds.includes(product.category_id),
      ).length;
    }
    return productIds.length;
  }, [appliesTo, products, categoryIds, productIds]);

  const scope = SCOPES.find((item) => item.id === appliesTo);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (appliesTo === "category" && categoryIds.length === 0) {
      toast.error("Pick at least one room");
      return;
    }
    if (appliesTo === "products" && productIds.length === 0) {
      toast.error("Pick at least one piece");
      return;
    }
    const payload: typeof offerInput._input = {
      headline,
      description,
      discount_percent: Number(discount),
      valid_till: validTill,
      applies_to: appliesTo,
      accent,
      image_url: imageUrl,
      is_published: isPublished,
      category_ids: categoryIds,
      product_ids: productIds,
    };
    setBusy(true);
    try {
      await create({ data: payload });
      toast.success(isPublished ? "Offer is live" : "Offer saved as a draft");
      setHeadline("");
      setDescription("");
      setImageUrl("");
      onCreated();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save the offer",
      );
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[14px] text-foreground focus:border-walnut/50 focus:outline-none focus:ring-2 focus:ring-walnut/15";
  const labelClass =
    "font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft";

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border/70 bg-surface px-4 py-4"
    >
      <div className="flex items-center gap-2">
        <Tag className="h-3.5 w-3.5 text-brass" />
        <h2 className="font-display text-[17px] text-foreground">Post an offer</h2>
      </div>

      <label className="mt-4 block">
        <span className={labelClass}>Headline</span>
        <input
          required
          value={headline}
          onChange={(event) => setHeadline(event.target.value)}
          placeholder="Monsoon Living Sale"
          className={field}
        />
      </label>

      <label className="mt-3 block">
        <span className={labelClass}>Details (optional)</span>
        <textarea
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What should customers know about this offer?"
          className={`${field} resize-none`}
        />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className={labelClass}>Discount %</span>
          <input
            required
            type="number"
            min={1}
            max={90}
            step={1}
            value={discount}
            onChange={(event) => setDiscount(event.target.value)}
            className={field}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Valid till</span>
          <input
            required
            type="date"
            value={validTill}
            onChange={(event) => setValidTill(event.target.value)}
            className={`${field} date-affordance`}
          />
        </label>
      </div>

      <div className="mt-4">
        <span className={labelClass}>Applies to</span>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {SCOPES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAppliesTo(item.id)}
              aria-pressed={appliesTo === item.id}
              className={`rounded-xl border px-2 py-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
                appliesTo === item.id
                  ? "border-transparent bg-walnut text-walnut-foreground"
                  : "border-border bg-background text-ink-soft hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-ink-soft">{scope?.hint}</p>
      </div>

      {appliesTo === "category" && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.map((category) => {
            const active = categoryIds.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  setCategoryIds((prev) =>
                    active
                      ? prev.filter((id) => id !== category.id)
                      : [...prev, category.id],
                  )
                }
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                  active
                    ? "border-transparent bg-leaf text-leaf-foreground"
                    : "border-border bg-background text-ink-soft hover:text-foreground"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      )}

      {appliesTo === "products" && (
        <div className="no-scrollbar mt-3 max-h-44 space-y-1 overflow-y-auto rounded-xl border border-border/70 bg-background p-2">
          {products.map((product) => {
            const active = productIds.includes(product.id);
            return (
              <label
                key={product.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() =>
                    setProductIds((prev) =>
                      active
                        ? prev.filter((id) => id !== product.id)
                        : [...prev, product.id],
                    )
                  }
                  className="h-4 w-4 accent-walnut"
                />
                <span className="text-[13px] text-foreground">{product.name}</span>
              </label>
            );
          })}
        </div>
      )}

      <div className="mt-4">
        <span className={labelClass}>Accent</span>
        <div className="mt-1.5 flex gap-1.5">
          {(["walnut", "leaf", "brass"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setAccent(option)}
              aria-pressed={accent === option}
              className={`flex-1 rounded-xl border px-2 py-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
                accent === option
                  ? `${accentClasses[option]} border-transparent`
                  : "border-border bg-background text-ink-soft hover:text-foreground"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 block">
        <span className={labelClass}>Banner image link (optional)</span>
        <div className="relative">
          <ImagePlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://…"
            className={`${field} pl-9`}
          />
        </div>
      </label>

      <label className="mt-4 flex items-center gap-2.5 rounded-xl bg-sand px-3.5 py-3">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(event) => setIsPublished(event.target.checked)}
          className="h-4 w-4 accent-walnut"
        />
        <span className="text-[13px] text-foreground">
          Publish now
          <span className="block text-[11px] text-ink-soft">
            Off gets a draft you can publish later.
          </span>
        </span>
      </label>

      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft">
        Covers {coveredCount} {coveredCount === 1 ? "piece" : "pieces"}
      </p>

      <button
        type="submit"
        disabled={busy}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-walnut py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-walnut-foreground transition-colors hover:bg-walnut/90 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {busy ? "Saving…" : isPublished ? "Publish offer" : "Save draft"}
      </button>
    </form>
  );
}
