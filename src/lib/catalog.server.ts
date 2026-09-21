/**
 * Server-only reads against the backend. Row level security decides what each
 * caller sees: anonymous readers get live published offers only, the owner sees
 * everything.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  CategoryRow,
  LiveOffer,
  OfferAccent,
  OfferRow,
  OfferScope,
  ProductRow,
} from "./pricing";

export function publicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

type SupabaseClient = ReturnType<typeof publicClient>;

const STORAGE_PREFIX = "storage://";
const PHOTO_LINK_SECONDS = 6 * 60 * 60;

/**
 * Offer photos live in Cloud storage. Browsers can't show a stored file
 * directly, so swap the stored reference for a time-limited link. Anything
 * that already looks like a normal link (or a bundled picture name) is
 * handed back untouched.
 */
export async function resolveStoredImage(
  supabase: SupabaseClient,
  value: string | null,
): Promise<string | null> {
  if (!value?.startsWith(STORAGE_PREFIX)) return value;

  const stored = value.slice(STORAGE_PREFIX.length);
  const slash = stored.indexOf("/");
  if (slash === -1) return null;

  const bucket = stored.slice(0, slash);
  const path = stored.slice(slash + 1);
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, PHOTO_LINK_SECONDS);

  return error ? null : (data?.signedUrl ?? null);
}

async function signImages<T extends { image_url: string | null }>(
  supabase: SupabaseClient,
  rows: T[],
): Promise<T[]> {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      image_url: await resolveStoredImage(supabase, row.image_url),
    })),
  );
}

interface RawCategory {
  id: string;
  name: string;
  slug: string;
  sort: number | string;
}

interface RawProduct {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number | string;
  original_price: number | string | null;
  image_url: string | null;
}

interface RawOffer {
  id: string;
  headline: string;
  description: string;
  discount_percent: number | string;
  valid_from: string;
  valid_till: string;
  applies_to: string;
  image_url: string | null;
  accent: string;
  is_published: boolean;
}

interface RawOfferCategoryLink {
  offer_id: string;
  category_id: string;
}

interface RawOfferProductLink {
  offer_id: string;
  product_id: string;
}

const num = (value: number | string | null): number => Number(value ?? 0);

function mapCategory(row: RawCategory): CategoryRow {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sort: num(row.sort),
  };
}

function mapProduct(row: RawProduct): ProductRow {
  return {
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    description: row.description,
    price: num(row.price),
    original_price: row.original_price == null ? null : num(row.original_price),
    image_url: row.image_url,
  };
}

function mapOffer(row: RawOffer): OfferRow {
  return {
    id: row.id,
    headline: row.headline,
    description: row.description,
    discount_percent: num(row.discount_percent),
    valid_from: row.valid_from,
    valid_till: row.valid_till,
    applies_to: row.applies_to as OfferScope,
    image_url: row.image_url,
    accent: row.accent as OfferAccent,
    is_published: row.is_published,
  };
}

function attachLinks(
  offers: OfferRow[],
  offerCategories: RawOfferCategoryLink[],
  offerProducts: RawOfferProductLink[],
): LiveOffer[] {
  return offers.map((offer) => ({
    ...offer,
    category_ids: offerCategories
      .filter((link) => link.offer_id === offer.id)
      .map((link) => link.category_id),
    product_ids: offerProducts
      .filter((link) => link.offer_id === offer.id)
      .map((link) => link.product_id),
  }));
}

export type CatalogBundle = {
  categories: CategoryRow[];
  products: ProductRow[];
  offers: LiveOffer[];
};

/** What any visitor sees: active products plus live published offers. */
export async function readCatalogBundle(
  supabase: SupabaseClient = publicClient(),
): Promise<CatalogBundle> {
  const [categories, products, offers, offerCategories, offerProducts] =
    await Promise.all([
      supabase.from("categories").select("*").order("sort"),
      supabase.from("products").select("*").order("created_at"),
      supabase
        .from("offers")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("offer_categories").select("*"),
      supabase.from("offer_products").select("*"),
    ]);

  for (const result of [categories, products, offers, offerCategories, offerProducts]) {
    if (result.error) throw new Error(result.error.message);
  }

  const catalog = {
    categories: ((categories.data ?? []) as unknown as RawCategory[]).map(mapCategory),
    products: ((products.data ?? []) as unknown as RawProduct[]).map(mapProduct),
    offers: attachLinks(
      ((offers.data ?? []) as unknown as RawOffer[]).map(mapOffer),
      (offerCategories.data ?? []) as unknown as RawOfferCategoryLink[],
      (offerProducts.data ?? []) as unknown as RawOfferProductLink[],
    ),
  };

  return {
    categories: catalog.categories,
    products: await signImages(supabase, catalog.products),
    offers: await signImages(supabase, catalog.offers),
  };
}

export type OwnerBundle = CatalogBundle & {
  /** Every offer, including drafts and expired ones. */
  allOffers: LiveOffer[];
};

/** Owner-only view: all offers with their full "applies to" links. */
export async function readOwnerBundle(supabase: SupabaseClient): Promise<OwnerBundle> {
  const [bundle, offers, links] = await Promise.all([
    readCatalogBundle(supabase),
    supabase.from("offers").select("*").order("created_at", { ascending: false }),
    readOwnerOfferLinks(supabase),
  ]);
  if (offers.error) throw new Error(offers.error.message);

  return {
    ...bundle,
    allOffers: await signImages(
      supabase,
      attachLinks(
        ((offers.data ?? []) as unknown as RawOffer[]).map(mapOffer),
        links.offerCategories,
        links.offerProducts,
      ),
    ),
  };
}

/** Reads offer links directly, since the public policy hides unpublished ones. */
export async function readOwnerOfferLinks(supabase: SupabaseClient): Promise<{
  offerCategories: RawOfferCategoryLink[];
  offerProducts: RawOfferProductLink[];
}> {
  const [offerCategories, offerProducts] = await Promise.all([
    supabase.from("offer_categories").select("*"),
    supabase.from("offer_products").select("*"),
  ]);
  if (offerCategories.error) throw new Error(offerCategories.error.message);
  if (offerProducts.error) throw new Error(offerProducts.error.message);
  return {
    offerCategories: (offerCategories.data ?? []) as unknown as RawOfferCategoryLink[],
    offerProducts: (offerProducts.data ?? []) as unknown as RawOfferProductLink[],
  };
}

export async function ownerExists(
  supabase: SupabaseClient = publicClient(),
): Promise<boolean> {
  const { data, error } = await supabase.rpc("owner_exists");
  if (error) throw new Error(error.message);
  return Boolean(data);
}
