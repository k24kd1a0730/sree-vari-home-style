# Sree Vari Furnitures — offers and catalog app

A phone-first app where the owner publishes offers and everyone who opens it sees them straight away on the home screen, then browses the full furniture catalog. No cart, no checkout, no payments.

## What you get

- **Home screen** — the owner's current offer pops up as a card over the home screen (close, or "Don't show again"). Under the header, live offers glide across as a banner carousel. Then category chips and a two-column product grid.
- **Catalog** — search by name, filter by category, every product shows its price, struck-through original price and a discount badge when it is on offer.
- **Product page** — large photo, price block with "Save X%", an "Offer terms" panel (which offer it belongs to, valid till, what it applies to), description, and related pieces.
- **Owner area (locked)** — the owner signs in, creates an offer (headline, description, discount, valid till, which categories or specific products, publish switch, optional photo), and sees a list of live and expired offers they can unpublish. Publishing an offer is what makes it pop up on the home screen.
- **Sample catalog** — about 12 pieces of furniture (sofas, dining, beds, storage) with generated photos and realistic rupee prices, so the app looks complete from the first open and the owner can replace items later.

## How it behaves

```text
Owner signs in -> creates offer -> publishes
                                     |
                                     v
Customer opens app -> offer popup (once per device) -> banner carousel
                                     |
                                     v
                     browse catalog -> product page shows offer terms
```

An offer is "live" while it is published and today's date is up to its valid-till date. Expired offers drop out of the popup, the carousel and the badges automatically. "Don't show again" is remembered on that device only, so the popup returns after the owner publishes a new offer.

## Build steps

1. Turn on Lovable Cloud for the database, file storage and owner login.
2. Create the data tables and access rules: customers can read published offers and products; only the owner account can add or change them. Roles live in their own table so a customer can never grant themselves owner access.
3. Convert the chosen "Warm showroom" look into the project's design tokens: Fraunces headings, Inter body, JetBrains Mono for small labels, walnut / sand / brass / leaf palette, soft radii and the pop-in and glide animations. Fonts load through a link tag in the root route.
4. Generate the furniture photography and wire the home screen: header, offer popup, banner carousel, category chips, product grid, bottom tab bar.
5. Build the catalog and product pages with live offer pricing computed from the offer each product belongs to.
6. Build the owner sign-in page and the offer form plus live/expired offer list, with photo upload.
7. Check it end to end in the preview: publish an offer as the owner, then reopen as a visitor and confirm the popup, banners, badges and offer terms all update.

## Technical details

- **Stack** — TanStack Start routes: `/` home, `/catalog`, `/product/$id`, `/owner` (offer manager), `/login`. Data reads through route loaders plus React Query; writes through server functions.
- **Schema** (public schema, with grants and row-level security on every table)
  - `categories(id, name, sort)`
  - `products(id, name, category_id, description, price numeric, original_price numeric, image_url, is_active, created_at)`
  - `offers(id, headline, description, discount_percent int, valid_till date, applies_to text check in ('all','category','products'), image_url, is_published bool, created_by uuid, created_at)`
  - `offer_categories(offer_id, category_id)` and `offer_products(offer_id, product_id)` for "applies to"
  - `user_roles(user_id, role app_role enum('owner'))` with a security-definer `has_role()` helper; owner-only policies call that function, never a client-side flag
- **Auth** — Lovable Cloud login. The owner account is the only row in `user_roles`. Customers browse without signing in.
- **Offer resolution** — a product's displayed price is its `price` unless a live published offer covers it, in which case `price * (1 - discount_percent/100)` and the offer headline feed the badge and terms panel.
- **Popup logic** — the newest live published offer, shown once per device per offer, stored in `localStorage` behind a hydration guard.
- **Images** — generated product and offer photos saved under `src/assets/`; owner uploads go to Cloud storage.
- **Responsive** — the phone-frame composition from the direction becomes a centered column on desktop and fills the screen on a phone.
- **Metadata** — the home and owner routes carry their own page titles and descriptions naming Sree Vari Furnitures.

## Decisions worth confirming

- Sample products, prices and offer copy are invented placeholders — real names, photos and prices can be swapped in any time.
- The owner signs in with email and password. Tell me if you would rather the owner panel sit behind a simple private link instead.
- No WhatsApp or phone enquiry button for now, since you said customers only view. Say the word and I will add one on the product page.
