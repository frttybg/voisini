-- =====================================================================
-- VOISINI — 0005_payments.sql
-- Stripe Connect alanları, webhook tekrar koruması, ödeme yardımcıları
-- (0001–0004'ten sonra çalıştırın)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Satıcı ödeme hesabı alanları
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists stripe_account_id   text,
  add column if not exists payouts_enabled     boolean not null default false,
  add column if not exists payouts_requirements jsonb not null default '{}';

create index if not exists profiles_stripe_account_idx
  on public.profiles (stripe_account_id)
  where stripe_account_id is not null;

-- Ayrıcalıklı alanları koru: kullanıcı kendi rolünü, doğrulama rozetlerini,
-- puan ortalamasını veya ödeme hesabını DEĞİŞTİREMEZ. Bu alanlar yalnızca
-- service_role (webhook / arka plan) veya admin tarafından güncellenebilir.
create or replace function public.protect_privileged_fields()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    new.stripe_account_id    := old.stripe_account_id;
    new.payouts_enabled      := old.payouts_enabled;
    new.payouts_requirements := old.payouts_requirements;
    new.rating_avg           := old.rating_avg;
    new.rating_count         := old.rating_count;
    new.email_verified       := old.email_verified;

    if not public.is_admin() then
      new.role              := old.role;
      new.is_banned         := old.is_banned;
      new.banned_until      := old.banned_until;
      new.ban_reason        := old.ban_reason;
      new.phone_verified    := old.phone_verified;
      new.identity_verified := old.identity_verified;
      new.is_trusted        := old.is_trusted;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_payout on public.profiles;
drop trigger if exists profiles_protect_privileged on public.profiles;
create trigger profiles_protect_privileged
  before update on public.profiles
  for each row execute function public.protect_privileged_fields();

-- ---------------------------------------------------------------------
-- Webhook tekrar koruması (idempotency)
-- ---------------------------------------------------------------------
create table if not exists public.payment_events (
  id           text primary key,          -- Stripe event id (evt_...)
  type         text not null,
  payload      jsonb not null default '{}',
  processed_at timestamptz not null default now()
);

alter table public.payment_events enable row level security;
-- Politika yok: yalnızca service_role erişir.

-- ---------------------------------------------------------------------
-- Her işlem için en fazla bir depozito kaydı
-- ---------------------------------------------------------------------
create unique index if not exists deposits_transaction_unique
  on public.deposits (transaction_id);

-- ---------------------------------------------------------------------
-- Ödeme durumu okuma (kullanıcı tarafı)
-- ---------------------------------------------------------------------
create or replace function public.payment_state(p_transaction_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'payment_status', (
      select p.status from public.payments p
       where p.transaction_id = p_transaction_id
       order by p.created_at desc limit 1
    ),
    'paid_cents', (
      select coalesce(sum(p.amount_cents), 0) from public.payments p
       where p.transaction_id = p_transaction_id and p.status in ('captured', 'authorized')
    ),
    'deposit_status', (
      select d.status from public.deposits d where d.transaction_id = p_transaction_id
    )
  )
  where exists (
    select 1 from public.transactions t
     where t.id = p_transaction_id
       and (t.buyer_id = auth.uid() or t.seller_id = auth.uid() or public.is_admin())
  );
$$;

-- ---------------------------------------------------------------------
-- my_transactions() — ödeme durumunu da döndürecek şekilde güncellendi
-- ---------------------------------------------------------------------
drop function if exists public.my_transactions(integer);

create or replace function public.my_transactions(p_limit integer default 50)
returns table (
  id             uuid,
  listing_id     uuid,
  listing_title  text,
  listing_slug   text,
  listing_type   listing_type,
  image_path     text,
  kind           transaction_kind,
  status         transaction_status,
  amount_cents   integer,
  currency       text,
  starts_at      timestamptz,
  ends_at        timestamptz,
  completed_at   timestamptz,
  created_at     timestamptz,
  is_buyer       boolean,
  counterpart_id uuid,
  counterpart_name text,
  counterpart_avatar text,
  deposit_cents  integer,
  deposit_status deposit_status,
  i_confirmed    boolean,
  i_rated        boolean,
  payment_status payment_status,
  seller_payouts_enabled boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.listing_id,
    l.title,
    l.slug,
    l.type,
    (select i.path from public.listing_images i
      where i.listing_id = l.id order by i.is_primary desc, i.position asc limit 1),
    t.kind,
    t.status,
    t.amount_cents,
    t.currency,
    t.starts_at,
    t.ends_at,
    t.completed_at,
    t.created_at,
    (t.buyer_id = auth.uid()) as is_buyer,
    c.id,
    c.display_name,
    c.avatar_url,
    d.amount_cents,
    d.status,
    coalesce(
      (case when t.notes ~ '^\s*\{'
            then (t.notes::jsonb->'confirmed') @> to_jsonb(auth.uid()::text)
            else false end),
      false
    ),
    exists (select 1 from public.ratings r where r.transaction_id = t.id and r.rater_id = auth.uid()),
    (select p.status from public.payments p
      where p.transaction_id = t.id order by p.created_at desc limit 1),
    coalesce(s.payouts_enabled, false)
  from public.transactions t
  join public.listings l on l.id = t.listing_id
  join public.profiles c
    on c.id = case when t.buyer_id = auth.uid() then t.seller_id else t.buyer_id end
  join public.profiles s on s.id = t.seller_id
  left join public.deposits d on d.transaction_id = t.id
  where t.buyer_id = auth.uid() or t.seller_id = auth.uid()
  order by t.created_at desc
  limit greatest(1, least(p_limit, 100));
$$;

-- ---------------------------------------------------------------------
-- Ödeme tamamlandığında işlemi ilerlet (webhook service_role ile çağırır)
-- ---------------------------------------------------------------------
create or replace function public.mark_transaction_paid(p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx public.transactions%rowtype;
begin
  select * into v_tx from public.transactions where id = p_transaction_id;
  if v_tx.id is null then return; end if;

  if v_tx.status in ('requested', 'accepted') then
    update public.transactions set status = 'in_progress' where id = p_transaction_id;
  end if;

  perform public.notify(v_tx.seller_id, 'payment', 'Paiement reçu', null,
    '/deals', jsonb_build_object('transaction_id', p_transaction_id));
  perform public.notify(v_tx.buyer_id, 'payment', 'Paiement confirmé', null,
    '/deals', jsonb_build_object('transaction_id', p_transaction_id));
end;
$$;
