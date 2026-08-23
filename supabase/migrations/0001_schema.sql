-- =====================================================================
-- VOISINI — 0001_schema.sql
-- Tablolar, tipler, ilişkiler, indeksler, trigger'lar
-- Supabase SQL Editor'da sırayla çalıştırın: 0001 -> 0002 -> 0003 -> seed
-- =====================================================================

create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------
-- ENUM tipleri
-- ---------------------------------------------------------------------
do $$ begin
  create type listing_type as enum ('sell', 'give', 'lend', 'rent', 'swap');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_status as enum ('draft', 'pending', 'active', 'reserved', 'completed', 'archived', 'removed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type item_condition as enum ('new', 'like_new', 'good', 'fair', 'for_parts');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rent_period as enum ('hour', 'day', 'week', 'month');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_kind as enum ('sale', 'rental', 'loan', 'swap', 'gift');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_status as enum ('requested', 'accepted', 'declined', 'cancelled', 'in_progress', 'awaiting_return', 'completed', 'disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type deposit_status as enum ('pending', 'authorized', 'captured', 'released', 'partially_released', 'disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type dispute_status as enum ('open', 'under_review', 'resolved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('open', 'reviewing', 'actioned', 'dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_target as enum ('listing', 'user', 'message', 'review');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('user', 'moderator', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_kind as enum ('email', 'phone', 'identity', 'trusted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type swap_offer_status as enum ('pending', 'accepted', 'declined', 'countered', 'withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_kind as enum (
    'message', 'offer', 'offer_accepted', 'offer_declined', 'favorite',
    'review', 'payment', 'rental_start', 'rental_end', 'return_reminder',
    'deposit', 'listing_approved', 'listing_removed', 'system'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Yardımcı: updated_at trigger fonksiyonu
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles — auth.users ile 1:1
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  username          citext unique,
  display_name      text not null default '',
  bio               text default '',
  avatar_url        text,
  phone             text,
  locale            text not null default 'fr',
  role              user_role not null default 'user',
  email_verified    boolean not null default false,
  phone_verified    boolean not null default false,
  identity_verified boolean not null default false,
  is_trusted        boolean not null default false,
  is_banned         boolean not null default false,
  banned_until      timestamptz,
  ban_reason        text,
  onboarding_step   smallint not null default 0,
  onboarded_at      timestamptz,
  -- yaklaşık (herkese açık) konum
  city              text,
  region            text,
  postal_code       text,
  country           text default 'FR',
  geo               extensions.geography(Point, 4326),
  search_radius_m   integer not null default 10000,
  interests         text[] not null default '{}',
  show_distance     boolean not null default true,
  allow_messages    boolean not null default true,
  email_notifications boolean not null default true,
  rating_avg        numeric(3,2) not null default 0,
  rating_count      integer not null default 0,
  listings_count    integer not null default 0,
  last_seen_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint username_format check (username is null or username ~ '^[a-z0-9_]{3,24}$')
);

create index if not exists profiles_geo_idx on public.profiles using gist (geo);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_city_idx on public.profiles (city);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Yeni kullanıcı kaydında profil oluştur
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, locale, email_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'locale', 'fr'),
    new.email_confirmed_at is not null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- E-posta doğrulandığında profile yansıt
create or replace function public.handle_user_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null and (old.email_confirmed_at is null) then
    update public.profiles set email_verified = true where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users
  for each row execute function public.handle_user_email_confirmed();

-- ---------------------------------------------------------------------
-- addresses — kullanıcının TAM adresi (asla herkese açık değil)
-- ---------------------------------------------------------------------
create table if not exists public.addresses (
  id           uuid primary key default extensions.uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  label        text not null default 'home',
  line1        text,
  line2        text,
  city         text not null,
  postal_code  text,
  region       text,
  country      text not null default 'FR',
  lat          double precision not null,
  lng          double precision not null,
  geo          extensions.geography(Point, 4326)
                 generated always as (extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography) stored,
  is_default   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists addresses_user_idx on public.addresses (user_id);
create index if not exists addresses_geo_idx on public.addresses using gist (geo);

drop trigger if exists addresses_updated_at on public.addresses;
create trigger addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default extensions.uuid_generate_v4(),
  slug        text not null unique,
  parent_id   uuid references public.categories(id) on delete set null,
  icon        text,
  color       text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  name_fr     text not null,
  name_tr     text not null,
  name_en     text not null,
  name_de     text not null,
  name_ar     text not null,
  name_es     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists categories_parent_idx on public.categories (parent_id);

-- ---------------------------------------------------------------------
-- listings — platformun merkezi
-- ---------------------------------------------------------------------
create table if not exists public.listings (
  id              uuid primary key default extensions.uuid_generate_v4(),
  slug            text not null unique,
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  category_id     uuid references public.categories(id) on delete set null,
  type            listing_type not null,
  status          listing_status not null default 'active',
  title           text not null,
  description     text not null default '',
  condition       item_condition,

  -- SAT
  price_cents     integer check (price_cents is null or price_cents >= 0),
  currency        text not null default 'EUR',
  is_negotiable   boolean not null default false,

  -- KİRALA
  rent_price_cents integer check (rent_price_cents is null or rent_price_cents >= 0),
  rent_period      rent_period,
  deposit_cents    integer check (deposit_cents is null or deposit_cents >= 0),
  min_rent_units   integer,
  max_rent_units   integer,

  -- ÖDÜNÇ
  lend_from        date,
  lend_to          date,
  lend_terms       text,

  -- TAKAS
  swap_wanted      text[] not null default '{}',

  -- Konum (yaklaşık — gizlilik için bulanıklaştırılmış)
  city            text,
  postal_code     text,
  region          text,
  country         text not null default 'FR',
  geo             extensions.geography(Point, 4326),
  precision_m     integer not null default 300,

  view_count      integer not null default 0,
  favorite_count  integer not null default 0,
  message_count   integer not null default 0,
  search_vector   tsvector,

  published_at    timestamptz default now(),
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint sell_needs_price check (type <> 'sell' or price_cents is not null),
  constraint rent_needs_price check (type <> 'rent' or (rent_price_cents is not null and rent_period is not null)),
  constraint title_len check (char_length(title) between 3 and 120),
  constraint desc_len check (char_length(description) <= 5000)
);

create index if not exists listings_geo_idx on public.listings using gist (geo);
create index if not exists listings_status_type_idx on public.listings (status, type);
create index if not exists listings_owner_idx on public.listings (owner_id);
create index if not exists listings_category_idx on public.listings (category_id);
create index if not exists listings_published_idx on public.listings (published_at desc);
create index if not exists listings_search_idx on public.listings using gin (search_vector);
create index if not exists listings_title_trgm_idx on public.listings using gin (title extensions.gin_trgm_ops);

drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at before update on public.listings
  for each row execute function public.set_updated_at();

create or replace function public.listings_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.city, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.description, '')), 'C');
  return new;
end;
$$;

drop trigger if exists listings_search_vector on public.listings;
create trigger listings_search_vector before insert or update of title, description, city
  on public.listings for each row execute function public.listings_search_vector_update();

-- ---------------------------------------------------------------------
-- listing_images
-- ---------------------------------------------------------------------
create table if not exists public.listing_images (
  id          uuid primary key default extensions.uuid_generate_v4(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  path        text not null,
  width       integer,
  height      integer,
  position    smallint not null default 0,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists listing_images_listing_idx on public.listing_images (listing_id, position);

-- ---------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------
create table if not exists public.favorites (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  listing_id  uuid not null references public.listings(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, listing_id)
);
create index if not exists favorites_listing_idx on public.favorites (listing_id);

create or replace function public.sync_favorite_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.listings set favorite_count = favorite_count + 1 where id = new.listing_id;
  elsif tg_op = 'DELETE' then
    update public.listings set favorite_count = greatest(favorite_count - 1, 0) where id = old.listing_id;
  end if;
  return null;
end;
$$;

drop trigger if exists favorites_count on public.favorites;
create trigger favorites_count after insert or delete on public.favorites
  for each row execute function public.sync_favorite_count();

-- ---------------------------------------------------------------------
-- conversations & messages
-- ---------------------------------------------------------------------
create table if not exists public.conversations (
  id            uuid primary key default extensions.uuid_generate_v4(),
  listing_id    uuid references public.listings(id) on delete set null,
  buyer_id      uuid not null references public.profiles(id) on delete cascade,
  seller_id     uuid not null references public.profiles(id) on delete cascade,
  last_message  text,
  last_message_at timestamptz,
  buyer_unread  integer not null default 0,
  seller_unread integer not null default 0,
  buyer_archived  boolean not null default false,
  seller_archived boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint conversation_distinct_parties check (buyer_id <> seller_id),
  unique (listing_id, buyer_id, seller_id)
);
create index if not exists conversations_buyer_idx on public.conversations (buyer_id, last_message_at desc);
create index if not exists conversations_seller_idx on public.conversations (seller_id, last_message_at desc);

create table if not exists public.messages (
  id              uuid primary key default extensions.uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null,
  attachment_path text,
  read_at         timestamptz,
  created_at      timestamptz not null default now(),
  constraint body_len check (char_length(body) between 1 and 4000)
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------
-- transactions / payments / rentals / loans / exchanges / deposits
-- ---------------------------------------------------------------------
create table if not exists public.transactions (
  id            uuid primary key default extensions.uuid_generate_v4(),
  listing_id    uuid not null references public.listings(id) on delete restrict,
  buyer_id      uuid not null references public.profiles(id) on delete restrict,
  seller_id     uuid not null references public.profiles(id) on delete restrict,
  kind          transaction_kind not null,
  status        transaction_status not null default 'requested',
  amount_cents  integer not null default 0,
  currency      text not null default 'EUR',
  starts_at     timestamptz,
  ends_at       timestamptz,
  completed_at  timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists transactions_buyer_idx on public.transactions (buyer_id, created_at desc);
create index if not exists transactions_seller_idx on public.transactions (seller_id, created_at desc);
create index if not exists transactions_listing_idx on public.transactions (listing_id);

drop trigger if exists transactions_updated_at on public.transactions;
create trigger transactions_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();

create table if not exists public.payments (
  id                uuid primary key default extensions.uuid_generate_v4(),
  transaction_id    uuid not null references public.transactions(id) on delete cascade,
  provider          text not null default 'stripe',
  provider_intent_id text,
  provider_charge_id text,
  status            payment_status not null default 'pending',
  amount_cents      integer not null,
  fee_cents         integer not null default 0,
  currency          text not null default 'EUR',
  error_message     text,
  metadata          jsonb not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (provider, provider_intent_id)
);
create index if not exists payments_transaction_idx on public.payments (transaction_id);

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

create table if not exists public.deposits (
  id                uuid primary key default extensions.uuid_generate_v4(),
  transaction_id    uuid not null references public.transactions(id) on delete cascade,
  amount_cents      integer not null,
  currency          text not null default 'EUR',
  status            deposit_status not null default 'pending',
  provider          text not null default 'stripe',
  provider_intent_id text,
  released_cents    integer not null default 0,
  released_at       timestamptz,
  note              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists deposits_transaction_idx on public.deposits (transaction_id);

drop trigger if exists deposits_updated_at on public.deposits;
create trigger deposits_updated_at before update on public.deposits
  for each row execute function public.set_updated_at();

create table if not exists public.rentals (
  id              uuid primary key default extensions.uuid_generate_v4(),
  transaction_id  uuid not null unique references public.transactions(id) on delete cascade,
  period          rent_period not null,
  units           integer not null check (units > 0),
  unit_price_cents integer not null,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  returned_at     timestamptz,
  condition_note  text,
  created_at      timestamptz not null default now()
);

create table if not exists public.loans (
  id              uuid primary key default extensions.uuid_generate_v4(),
  transaction_id  uuid not null unique references public.transactions(id) on delete cascade,
  due_at          timestamptz not null,
  returned_at     timestamptz,
  reminder_sent_at timestamptz,
  terms           text,
  created_at      timestamptz not null default now()
);

create table if not exists public.exchanges (
  id                uuid primary key default extensions.uuid_generate_v4(),
  listing_id        uuid not null references public.listings(id) on delete cascade,
  offered_listing_id uuid references public.listings(id) on delete set null,
  offered_by        uuid not null references public.profiles(id) on delete cascade,
  offered_text      text,
  cash_adjust_cents integer not null default 0,
  status            swap_offer_status not null default 'pending',
  parent_offer_id   uuid references public.exchanges(id) on delete set null,
  transaction_id    uuid references public.transactions(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists exchanges_listing_idx on public.exchanges (listing_id, status);
create index if not exists exchanges_offered_by_idx on public.exchanges (offered_by);

drop trigger if exists exchanges_updated_at on public.exchanges;
create trigger exchanges_updated_at before update on public.exchanges
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- ratings — sadece tamamlanmış işlem sonrası
-- ---------------------------------------------------------------------
create table if not exists public.ratings (
  id              uuid primary key default extensions.uuid_generate_v4(),
  transaction_id  uuid not null references public.transactions(id) on delete cascade,
  rater_id        uuid not null references public.profiles(id) on delete cascade,
  ratee_id        uuid not null references public.profiles(id) on delete cascade,
  score           smallint not null check (score between 1 and 5),
  comment         text,
  created_at      timestamptz not null default now(),
  unique (transaction_id, rater_id),
  constraint no_self_rating check (rater_id <> ratee_id)
);
create index if not exists ratings_ratee_idx on public.ratings (ratee_id, created_at desc);

create or replace function public.sync_rating_aggregate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.ratee_id, old.ratee_id);
begin
  update public.profiles p
     set rating_avg = coalesce((select round(avg(score)::numeric, 2) from public.ratings where ratee_id = target), 0),
         rating_count = (select count(*) from public.ratings where ratee_id = target)
   where p.id = target;
  return null;
end;
$$;

drop trigger if exists ratings_aggregate on public.ratings;
create trigger ratings_aggregate after insert or update or delete on public.ratings
  for each row execute function public.sync_rating_aggregate();

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default extensions.uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        notification_kind not null,
  title       text not null,
  body        text,
  url         text,
  data        jsonb not null default '{}',
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- ---------------------------------------------------------------------
-- moderasyon & güvenlik
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id            uuid primary key default extensions.uuid_generate_v4(),
  reporter_id   uuid not null references public.profiles(id) on delete cascade,
  target        report_target not null,
  target_id     uuid not null,
  reason        text not null,
  details       text,
  status        report_status not null default 'open',
  resolved_by   uuid references public.profiles(id) on delete set null,
  resolved_at   timestamptz,
  resolution    text,
  created_at    timestamptz not null default now()
);
create index if not exists reports_status_idx on public.reports (status, created_at desc);
create index if not exists reports_target_idx on public.reports (target, target_id);

create table if not exists public.blocks (
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

create table if not exists public.verifications (
  id          uuid primary key default extensions.uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        verification_kind not null,
  status      verification_status not null default 'pending',
  evidence    jsonb not null default '{}',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists verifications_user_idx on public.verifications (user_id, kind);

create table if not exists public.disputes (
  id              uuid primary key default extensions.uuid_generate_v4(),
  transaction_id  uuid not null references public.transactions(id) on delete cascade,
  opened_by       uuid not null references public.profiles(id) on delete cascade,
  status          dispute_status not null default 'open',
  reason          text not null,
  details         text,
  resolution      text,
  resolved_by     uuid references public.profiles(id) on delete set null,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists disputes_status_idx on public.disputes (status, created_at desc);

drop trigger if exists disputes_updated_at on public.disputes;
create trigger disputes_updated_at before update on public.disputes
  for each row execute function public.set_updated_at();

create table if not exists public.admin_actions (
  id          uuid primary key default extensions.uuid_generate_v4(),
  admin_id    uuid not null references public.profiles(id) on delete set null,
  action      text not null,
  target_type text not null,
  target_id   uuid,
  reason      text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists admin_actions_admin_idx on public.admin_actions (admin_id, created_at desc);

create table if not exists public.audit_logs (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id) on delete set null,
  event       text not null,
  ip          inet,
  user_agent  text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_event_idx on public.audit_logs (event, created_at desc);

create table if not exists public.rate_limits (
  key         text not null,
  window_start timestamptz not null,
  count       integer not null default 0,
  primary key (key, window_start)
);
create index if not exists rate_limits_window_idx on public.rate_limits (window_start);
