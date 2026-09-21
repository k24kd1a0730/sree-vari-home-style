-- Sree Vari Furnitures: catalog, offers, owner role

create type public.app_role as enum ('owner');

-- ---------------------------------------------------------------------------
-- roles
-- ---------------------------------------------------------------------------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  );
$$;

create or replace function public.owner_exists()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where role = 'owner');
$$;

grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function public.owner_exists() to anon, authenticated, service_role;

alter table public.user_roles enable row level security;
create policy "owner reads roles" on public.user_roles
  for select to authenticated
  using (public.has_role(auth.uid(), 'owner'));

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;

alter table public.categories enable row level security;
create policy "public reads categories" on public.categories
  for select to anon, authenticated using (true);
create policy "owner manages categories" on public.categories
  for all to authenticated
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  description text not null default '',
  price numeric(12,2) not null check (price > 0),
  original_price numeric(12,2) check (original_price >= price),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;

alter table public.products enable row level security;
create policy "public reads active products" on public.products
  for select to anon, authenticated using (is_active);
create policy "owner manages products" on public.products
  for all to authenticated
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

-- ---------------------------------------------------------------------------
-- offers
-- ---------------------------------------------------------------------------
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  description text not null default '',
  discount_percent integer not null check (discount_percent between 1 and 90),
  valid_from date not null default current_date,
  valid_till date not null,
  applies_to text not null default 'all' check (applies_to in ('all','category','products')),
  image_url text,
  accent text not null default 'walnut' check (accent in ('walnut','leaf','brass')),
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

grant select on public.offers to anon, authenticated;
grant insert, update, delete on public.offers to authenticated;
grant all on public.offers to service_role;

alter table public.offers enable row level security;
create policy "public reads live published offers" on public.offers
  for select to anon, authenticated
  using (is_published and valid_from <= current_date and valid_till >= current_date);
create policy "owner manages offers" on public.offers
  for all to authenticated
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

create table public.offer_categories (
  offer_id uuid not null references public.offers(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (offer_id, category_id)
);

grant select on public.offer_categories to anon, authenticated;
grant insert, delete on public.offer_categories to authenticated;
grant all on public.offer_categories to service_role;

alter table public.offer_categories enable row level security;
create policy "public reads live offer categories" on public.offer_categories
  for select to anon, authenticated
  using (exists (
    select 1 from public.offers o
    where o.id = offer_id and o.is_published
      and o.valid_from <= current_date and o.valid_till >= current_date
  ));
create policy "owner manages offer categories" on public.offer_categories
  for all to authenticated
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

create table public.offer_products (
  offer_id uuid not null references public.offers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (offer_id, product_id)
);

grant select on public.offer_products to anon, authenticated;
grant insert, delete on public.offer_products to authenticated;
grant all on public.offer_products to service_role;

alter table public.offer_products enable row level security;
create policy "public reads live offer products" on public.offer_products
  for select to anon, authenticated
  using (exists (
    select 1 from public.offers o
    where o.id = offer_id and o.is_published
      and o.valid_from <= current_date and o.valid_till >= current_date
  ));
create policy "owner manages offer products" on public.offer_products
  for all to authenticated
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

-- ---------------------------------------------------------------------------
-- seed data
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, sort) values
  ('Living', 'living', 1),
  ('Dining', 'dining', 2),
  ('Bedroom', 'bedroom', 3),
  ('Storage', 'storage', 4);

insert into public.products (category_id, name, description, price, original_price, image_url)
select c.id, v.name, v.description, v.price::numeric, v.original_price::numeric, v.image_url
from (values
  ('living','Aster 3-Seat Sofa','Solid walnut frame with a feather-and-fibre seat, upholstered in a warm sand weave built to be lived with for decades.',42400,53000,'aster-sofa'),
  ('living','Olive Lounge Chair','A low, deep lounge chair in olive cotton with a hand-oiled walnut frame.',18900,25200,'olive-lounge-chair'),
  ('living','Brass Coffee Table','Round walnut top on slim brushed brass legs, joined without visible fixings.',21000,25600,'brass-coffee-table'),
  ('living','Walnut Side Table','A compact bedside or sofa-side table with a single soft-close drawer.',9800,12400,'walnut-side-table'),
  ('living','Olive Ottoman','Upholstered ottoman that doubles as a footrest, extra seat or low table.',7200,9400,'olive-ottoman'),
  ('dining','Teak Dining Table','Eight-seater in solid teak, finished with a natural matte oil that wipes clean.',68000,80000,'teak-dining-table'),
  ('dining','Haven Dining Set','Six teak chairs with woven cane backs around a matching extendable table.',64000,78000,'haven-dining-set'),
  ('dining','Marble Console Table','A narrow console in green marble on a walnut base, made for entryways.',31500,38000,'marble-console'),
  ('bedroom','Linen Bed Frame','Queen bed frame in a warm linen weave with a slatted walnut headboard.',54000,69200,'linen-bed-frame'),
  ('bedroom','Nook Platform Bed','Low platform bed in oiled teak with under-bed storage on both sides.',39500,50600,'nook-platform-bed'),
  ('storage','Ash Bookshelf','Five open shelves in solid ash, fixed with wedged tenons, no screws.',16400,21000,'ash-bookshelf'),
  ('storage','Brass Sideboard','Walnut sideboard with brushed brass handles and a soft-close mechanism.',34500,38300,'brass-sideboard')
) as v(slug, name, description, price, original_price, image_url)
join public.categories c on c.slug = v.slug;

insert into public.offers
  (headline, description, discount_percent, valid_till, applies_to, image_url, accent, is_published)
values
  ('The Living Room Edit','Up to 20% off sofas, chairs and tables. Valid this fortnight, in-store and online.',20,(current_date + interval '14 days')::date,'category','living-room-edit','walnut',true),
  ('Solid Teak Series','15% off the hand-finished teak dining collection. Made to order in four weeks.',15,(current_date + interval '30 days')::date,'category',null,'leaf',true),
  ('Bedroom Refresh','A quarter off beds and bedroom frames while stock lasts.',25,(current_date + interval '7 days')::date,'category',null,'brass',true),
  ('Teak Weekend','25% off two dining pieces for the weekend sale.',25,(current_date - interval '10 days')::date,'products',null,'walnut',true);

insert into public.offer_categories (offer_id, category_id)
select o.id, c.id
from public.offers o
join public.categories c on c.slug = 'living'
where o.headline = 'The Living Room Edit';

insert into public.offer_categories (offer_id, category_id)
select o.id, c.id
from public.offers o
join public.categories c on c.slug = 'dining'
where o.headline = 'Solid Teak Series';

insert into public.offer_categories (offer_id, category_id)
select o.id, c.id
from public.offers o
join public.categories c on c.slug = 'bedroom'
where o.headline = 'Bedroom Refresh';

insert into public.offer_products (offer_id, product_id)
select o.id, p.id
from public.offers o
join public.products p on p.name in ('Teak Dining Table','Haven Dining Set')
where o.headline = 'Teak Weekend';
