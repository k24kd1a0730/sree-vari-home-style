/**
 * Server functions for the showroom. Public reads are anonymous and go through
 * row level security; every write re-checks the owner role on the server.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ownerExists,
  publicClient,
  readCatalogBundle,
  readOwnerBundle,
} from "./catalog.server";
import type { CatalogBundle, OwnerBundle } from "./catalog.server";

type Supabase = ReturnType<typeof publicClient>;
type Authed = { supabase: Supabase; userId: string };

/**
 * The auth middleware injects `{ supabase, userId, claims }` at call time; the
 * generated middleware doesn't expose that through inference, so read it here.
 */
function requireAuth(context: unknown): Authed {
  const ctx = context as Partial<Authed> | undefined;
  if (!ctx?.supabase || !ctx.userId) throw new Error("Sign in required");
  return { supabase: ctx.supabase, userId: ctx.userId };
}

const ownerCheckSchema = z.object({
  _user_id: z.string().uuid(),
  _role: z.string(),
});

async function assertOwner(supabase: Supabase, userId: string): Promise<void> {
  ownerCheckSchema.parse({ _user_id: userId, _role: "owner" });
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "owner",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Owner access only");
}

/** Home screen, catalog and product pages: everything a visitor may see. */
export const getCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<CatalogBundle> => readCatalogBundle(),
);

/** Whether the shop already has an owner account (drives the login screen). */
export const getOwnerSetupStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ ownerExists: boolean }> => ({
    ownerExists: await ownerExists(),
  }),
);

const setupSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});

/**
 * First run only: creates the owner login and gives it the owner role.
 * Closes itself permanently once an owner exists.
 */
export const setupOwner = createServerFn({ method: "POST" })
  .validator((data) => setupSchema.parse(data))
  .handler(async ({ data }) => {
    if (await ownerExists()) {
      throw new Error("An owner account already exists on this shop");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (created.error || !created.data.user) {
      throw new Error(created.error?.message ?? "Could not create the owner account");
    }
    const role = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.data.user.id, role: "owner" });
    if (role.error) throw new Error(role.error.message);
    return { email: data.email };
  });

/** Owner view: every offer, live, draft or expired. */
export const getOwnerDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OwnerBundle> => {
    const { supabase, userId } = requireAuth(context);
    await assertOwner(supabase, userId);
    return readOwnerBundle(supabase);
  });

export const offerInput = z.object({
  headline: z.string().trim().min(3, "Give the offer a short headline"),
  description: z.string().trim().default(""),
  discount_percent: z.coerce
    .number()
    .int("Whole numbers only")
    .min(1, "At least 1%")
    .max(90, "Up to 90%"),
  valid_till: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick an end date"),
  applies_to: z.enum(["all", "category", "products"]),
  accent: z.enum(["walnut", "leaf", "brass"]).default("walnut"),
  image_url: z.string().trim().optional().or(z.literal("")),
  is_published: z.boolean().default(true),
  category_ids: z.array(z.string().uuid()).default([]),
  product_ids: z.array(z.string().uuid()).default([]),
});

/** Publish a new offer. This is what makes it pop up for visitors. */
export const createOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => offerInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = requireAuth(context);
    await assertOwner(supabase, userId);

    const { data: offer, error } = await supabase
      .from("offers")
      .insert({
        headline: data.headline,
        description: data.description,
        discount_percent: data.discount_percent,
        valid_till: data.valid_till,
        applies_to: data.applies_to,
        accent: data.accent,
        image_url: data.image_url || null,
        is_published: data.is_published,
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (!offer) throw new Error("Could not save the offer");

    if (data.applies_to === "category" && data.category_ids.length > 0) {
      const links = await supabase
        .from("offer_categories")
        .insert(
          data.category_ids.map((category_id) => ({
            offer_id: offer.id,
            category_id,
          })),
        );
      if (links.error) throw new Error(links.error.message);
    }
    if (data.applies_to === "products" && data.product_ids.length > 0) {
      const links = await supabase
        .from("offer_products")
        .insert(
          data.product_ids.map((product_id) => ({
            offer_id: offer.id,
            product_id,
          })),
        );
      if (links.error) throw new Error(links.error.message);
    }

    return { id: offer.id };
  });

const publishedSchema = z.object({
  id: z.string().uuid(),
  is_published: z.boolean(),
});

/** Show or hide an offer on the home screen without deleting it. */
export const setOfferPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => publishedSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = requireAuth(context);
    await assertOwner(supabase, userId);
    const { error } = await supabase
      .from("offers")
      .update({ is_published: data.is_published })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { id: data.id, is_published: data.is_published };
  });

const deleteSchema = z.object({ id: z.string().uuid() });

export const deleteOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => deleteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = requireAuth(context);
    await assertOwner(supabase, userId);
    const { error } = await supabase.from("offers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { id: data.id };
  });
