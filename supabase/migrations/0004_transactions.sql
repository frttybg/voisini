-- =====================================================================
-- VOISINI — 0004_transactions.sql
-- İşlem döngüsü: talep → kabul → tamamlanma → puanlama
-- Takas teklifleri ve bildirim yardımcıları
-- (0001–0003'ten sonra çalıştırın)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Yardımcı: ilan türünden işlem türü
-- ---------------------------------------------------------------------
create or replace function public.kind_for_listing(p_type listing_type)
returns transaction_kind
language sql
immutable
as $$
  select case p_type
    when 'sell' then 'sale'::transaction_kind
    when 'rent' then 'rental'::transaction_kind
    when 'lend' then 'loan'::transaction_kind
    when 'give' then 'gift'::transaction_kind
    else 'swap'::transaction_kind
  end;
$$;

-- ---------------------------------------------------------------------
-- Yardımcı: bildirim oluştur
-- ---------------------------------------------------------------------
create or replace function public.notify(
  p_user_id uuid,
  p_kind notification_kind,
  p_title text,
  p_body text default null,
  p_url text default null,
  p_data jsonb default '{}'
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (user_id, kind, title, body, url, data)
  values (p_user_id, p_kind, p_title, p_body, p_url, p_data);
$$;

-- ---------------------------------------------------------------------
-- 1. İşlem talebi oluştur (alıcı tarafı)
-- ---------------------------------------------------------------------
create or replace function public.request_transaction(
  p_listing_id uuid,
  p_starts_at  timestamptz default null,
  p_ends_at    timestamptz default null,
  p_units      integer default null,
  p_note       text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me      uuid := auth.uid();
  v_listing public.listings%rowtype;
  v_kind    transaction_kind;
  v_amount  integer := 0;
  v_tx      uuid;
  v_units   integer := greatest(coalesce(p_units, 1), 1);
begin
  if v_me is null then raise exception 'not_authenticated'; end if;
  if public.is_banned(v_me) then raise exception 'account_suspended'; end if;

  select * into v_listing from public.listings where id = p_listing_id;
  if v_listing.id is null then raise exception 'listing_not_found'; end if;
  if v_listing.owner_id = v_me then raise exception 'cannot_deal_with_self'; end if;
  if v_listing.status <> 'active' then raise exception 'listing_unavailable'; end if;
  if public.blocked_between(v_me, v_listing.owner_id) then raise exception 'blocked'; end if;

  -- Aynı ilan için açık bir talep varsa onu döndür
  select id into v_tx
    from public.transactions
   where listing_id = p_listing_id
     and buyer_id = v_me
     and status in ('requested', 'accepted', 'in_progress', 'awaiting_return');
  if v_tx is not null then return v_tx; end if;

  v_kind := public.kind_for_listing(v_listing.type);

  v_amount := case
    when v_listing.type = 'sell' then coalesce(v_listing.price_cents, 0)
    when v_listing.type = 'rent' then coalesce(v_listing.rent_price_cents, 0) * v_units
    else 0
  end;

  insert into public.transactions (
    listing_id, buyer_id, seller_id, kind, status, amount_cents, currency,
    starts_at, ends_at, notes
  )
  values (
    p_listing_id, v_me, v_listing.owner_id, v_kind, 'requested', v_amount, v_listing.currency,
    p_starts_at, p_ends_at, left(coalesce(p_note, ''), 1000)
  )
  returning id into v_tx;

  -- Kiralama / ödünç detay kaydı
  if v_listing.type = 'rent' and p_starts_at is not null and p_ends_at is not null then
    insert into public.rentals (transaction_id, period, units, unit_price_cents, starts_at, ends_at)
    values (v_tx, coalesce(v_listing.rent_period, 'day'), v_units,
            coalesce(v_listing.rent_price_cents, 0), p_starts_at, p_ends_at);

    if coalesce(v_listing.deposit_cents, 0) > 0 then
      insert into public.deposits (transaction_id, amount_cents, currency, status)
      values (v_tx, v_listing.deposit_cents, v_listing.currency, 'pending');
    end if;
  end if;

  if v_listing.type = 'lend' then
    insert into public.loans (transaction_id, due_at, terms)
    values (v_tx, coalesce(p_ends_at, now() + interval '7 days'), v_listing.lend_terms);
  end if;

  perform public.notify(
    v_listing.owner_id, 'offer', 'Nouvelle demande', left(v_listing.title, 120),
    '/deals', jsonb_build_object('transaction_id', v_tx, 'listing_id', p_listing_id)
  );

  return v_tx;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Talebi yanıtla (satıcı tarafı)
-- ---------------------------------------------------------------------
create or replace function public.respond_transaction(
  p_transaction_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_tx public.transactions%rowtype;
begin
  if v_me is null then raise exception 'not_authenticated'; end if;

  select * into v_tx from public.transactions where id = p_transaction_id;
  if v_tx.id is null then raise exception 'transaction_not_found'; end if;
  if v_tx.seller_id <> v_me then raise exception 'forbidden'; end if;
  if v_tx.status <> 'requested' then raise exception 'invalid_state'; end if;

  if p_accept then
    update public.transactions set status = 'accepted' where id = p_transaction_id;
    update public.listings set status = 'reserved'
     where id = v_tx.listing_id and status = 'active';

    perform public.notify(
      v_tx.buyer_id, 'offer_accepted', 'Demande acceptée', null,
      '/deals', jsonb_build_object('transaction_id', p_transaction_id)
    );
  else
    update public.transactions set status = 'declined' where id = p_transaction_id;
    perform public.notify(
      v_tx.buyer_id, 'offer_declined', 'Demande refusée', null,
      '/deals', jsonb_build_object('transaction_id', p_transaction_id)
    );
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. İşlemi tamamla (her iki taraf da onaylar)
-- ---------------------------------------------------------------------
create or replace function public.complete_transaction(p_transaction_id uuid)
returns transaction_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_tx public.transactions%rowtype;
  v_other uuid;
  v_confirmed jsonb;
  v_notes jsonb;
begin
  if v_me is null then raise exception 'not_authenticated'; end if;

  select * into v_tx from public.transactions where id = p_transaction_id;
  if v_tx.id is null then raise exception 'transaction_not_found'; end if;
  if v_me <> v_tx.buyer_id and v_me <> v_tx.seller_id then raise exception 'forbidden'; end if;
  if v_tx.status not in ('accepted', 'in_progress', 'awaiting_return') then
    raise exception 'invalid_state';
  end if;

  -- Onaylar notes alanında JSON olarak tutulur (ek tablo gerektirmez)
  begin
    v_notes := coalesce(nullif(v_tx.notes, '')::jsonb, '{}'::jsonb);
  exception when others then
    v_notes := jsonb_build_object('note', v_tx.notes);
  end;

  v_confirmed := coalesce(v_notes->'confirmed', '[]'::jsonb);
  if not (v_confirmed @> to_jsonb(v_me::text)) then
    v_confirmed := v_confirmed || to_jsonb(v_me::text);
  end if;
  v_notes := jsonb_set(v_notes, '{confirmed}', v_confirmed);

  v_other := case when v_me = v_tx.buyer_id then v_tx.seller_id else v_tx.buyer_id end;

  if jsonb_array_length(v_confirmed) >= 2 then
    update public.transactions
       set status = 'completed',
           completed_at = now(),
           notes = v_notes::text
     where id = p_transaction_id;

    update public.listings set status = 'completed' where id = v_tx.listing_id;

    if v_tx.kind = 'rental' then
      update public.rentals set returned_at = now() where transaction_id = p_transaction_id;
      update public.deposits set status = 'released', released_at = now(),
             released_cents = amount_cents
       where transaction_id = p_transaction_id and status in ('pending', 'authorized', 'captured');
    end if;

    if v_tx.kind = 'loan' then
      update public.loans set returned_at = now() where transaction_id = p_transaction_id;
    end if;

    perform public.notify(v_tx.buyer_id, 'review', 'Transaction terminée', null,
      '/deals', jsonb_build_object('transaction_id', p_transaction_id));
    perform public.notify(v_tx.seller_id, 'review', 'Transaction terminée', null,
      '/deals', jsonb_build_object('transaction_id', p_transaction_id));

    return 'completed'::transaction_status;
  else
    update public.transactions
       set status = 'in_progress', notes = v_notes::text
     where id = p_transaction_id;

    perform public.notify(v_other, 'system', 'Confirmation attendue', null,
      '/deals', jsonb_build_object('transaction_id', p_transaction_id));

    return 'in_progress'::transaction_status;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. İşlemi iptal et
-- ---------------------------------------------------------------------
create or replace function public.cancel_transaction(p_transaction_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_tx public.transactions%rowtype;
  v_other uuid;
begin
  if v_me is null then raise exception 'not_authenticated'; end if;

  select * into v_tx from public.transactions where id = p_transaction_id;
  if v_tx.id is null then raise exception 'transaction_not_found'; end if;
  if v_me <> v_tx.buyer_id and v_me <> v_tx.seller_id then raise exception 'forbidden'; end if;
  if v_tx.status in ('completed', 'cancelled', 'declined') then raise exception 'invalid_state'; end if;

  update public.transactions set status = 'cancelled' where id = p_transaction_id;
  update public.listings set status = 'active'
   where id = v_tx.listing_id and status = 'reserved';

  update public.deposits set status = 'released', released_at = now(), released_cents = amount_cents
   where transaction_id = p_transaction_id and status in ('pending', 'authorized');

  v_other := case when v_me = v_tx.buyer_id then v_tx.seller_id else v_tx.buyer_id end;
  perform public.notify(v_other, 'system', 'Transaction annulée', left(coalesce(p_reason, ''), 120),
    '/deals', jsonb_build_object('transaction_id', p_transaction_id));
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Takas teklifi oluştur
-- ---------------------------------------------------------------------
create or replace function public.create_swap_offer(
  p_listing_id         uuid,
  p_offered_listing_id uuid default null,
  p_offered_text       text default null,
  p_cash_adjust_cents  integer default 0,
  p_parent_offer_id    uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me      uuid := auth.uid();
  v_listing public.listings%rowtype;
  v_offer   uuid;
begin
  if v_me is null then raise exception 'not_authenticated'; end if;
  if public.is_banned(v_me) then raise exception 'account_suspended'; end if;

  select * into v_listing from public.listings where id = p_listing_id;
  if v_listing.id is null then raise exception 'listing_not_found'; end if;
  if v_listing.owner_id = v_me and p_parent_offer_id is null then
    raise exception 'cannot_deal_with_self';
  end if;
  if public.blocked_between(v_me, v_listing.owner_id) then raise exception 'blocked'; end if;

  -- Teklif edilen ilan gerçekten teklif verenin mi?
  if p_offered_listing_id is not null then
    if not exists (
      select 1 from public.listings
      where id = p_offered_listing_id and owner_id = v_me
    ) then
      raise exception 'not_your_listing';
    end if;
  end if;

  if coalesce(p_offered_listing_id::text, '') = '' and coalesce(trim(p_offered_text), '') = '' then
    raise exception 'empty_offer';
  end if;

  insert into public.exchanges (
    listing_id, offered_listing_id, offered_by, offered_text, cash_adjust_cents, parent_offer_id
  )
  values (
    p_listing_id, p_offered_listing_id, v_me,
    left(coalesce(p_offered_text, ''), 500), coalesce(p_cash_adjust_cents, 0), p_parent_offer_id
  )
  returning id into v_offer;

  perform public.notify(
    case when v_listing.owner_id = v_me
         then (select offered_by from public.exchanges where id = p_parent_offer_id)
         else v_listing.owner_id end,
    'offer', 'Nouvelle proposition d''échange', left(v_listing.title, 120),
    '/deals', jsonb_build_object('exchange_id', v_offer, 'listing_id', p_listing_id)
  );

  return v_offer;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Takas teklifini yanıtla
-- ---------------------------------------------------------------------
create or replace function public.respond_swap_offer(
  p_exchange_id uuid,
  p_action      text          -- 'accept' | 'decline' | 'withdraw'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me      uuid := auth.uid();
  v_offer   public.exchanges%rowtype;
  v_listing public.listings%rowtype;
  v_tx      uuid;
begin
  if v_me is null then raise exception 'not_authenticated'; end if;

  select * into v_offer from public.exchanges where id = p_exchange_id;
  if v_offer.id is null then raise exception 'offer_not_found'; end if;
  select * into v_listing from public.listings where id = v_offer.listing_id;

  if p_action = 'withdraw' then
    if v_offer.offered_by <> v_me then raise exception 'forbidden'; end if;
    update public.exchanges set status = 'withdrawn' where id = p_exchange_id;
    return null;
  end if;

  if v_listing.owner_id <> v_me then raise exception 'forbidden'; end if;
  if v_offer.status <> 'pending' then raise exception 'invalid_state'; end if;

  if p_action = 'decline' then
    update public.exchanges set status = 'declined' where id = p_exchange_id;
    perform public.notify(v_offer.offered_by, 'offer_declined', 'Proposition refusée', null,
      '/deals', jsonb_build_object('exchange_id', p_exchange_id));
    return null;
  end if;

  if p_action <> 'accept' then raise exception 'invalid_action'; end if;

  insert into public.transactions (
    listing_id, buyer_id, seller_id, kind, status, amount_cents, currency
  )
  values (
    v_offer.listing_id, v_offer.offered_by, v_listing.owner_id, 'swap', 'accepted',
    abs(coalesce(v_offer.cash_adjust_cents, 0)), v_listing.currency
  )
  returning id into v_tx;

  update public.exchanges
     set status = 'accepted', transaction_id = v_tx
   where id = p_exchange_id;

  -- Aynı ilana gelen diğer teklifler reddedilir
  update public.exchanges
     set status = 'declined'
   where listing_id = v_offer.listing_id
     and id <> p_exchange_id
     and status = 'pending';

  update public.listings set status = 'reserved' where id = v_offer.listing_id;
  if v_offer.offered_listing_id is not null then
    update public.listings set status = 'reserved' where id = v_offer.offered_listing_id;
  end if;

  perform public.notify(v_offer.offered_by, 'offer_accepted', 'Proposition acceptée', null,
    '/deals', jsonb_build_object('transaction_id', v_tx));

  return v_tx;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Puanlama (yalnızca tamamlanmış işlem, yalnızca taraflar, tek kez)
-- ---------------------------------------------------------------------
create or replace function public.submit_rating(
  p_transaction_id uuid,
  p_score          smallint,
  p_comment        text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me     uuid := auth.uid();
  v_tx     public.transactions%rowtype;
  v_ratee  uuid;
  v_rating uuid;
begin
  if v_me is null then raise exception 'not_authenticated'; end if;
  if p_score < 1 or p_score > 5 then raise exception 'invalid_score'; end if;

  select * into v_tx from public.transactions where id = p_transaction_id;
  if v_tx.id is null then raise exception 'transaction_not_found'; end if;
  if v_tx.status <> 'completed' then raise exception 'not_completed'; end if;
  if v_me <> v_tx.buyer_id and v_me <> v_tx.seller_id then raise exception 'forbidden'; end if;

  if exists (
    select 1 from public.ratings where transaction_id = p_transaction_id and rater_id = v_me
  ) then
    raise exception 'already_rated';
  end if;

  v_ratee := case when v_me = v_tx.buyer_id then v_tx.seller_id else v_tx.buyer_id end;

  insert into public.ratings (transaction_id, rater_id, ratee_id, score, comment)
  values (p_transaction_id, v_me, v_ratee, p_score, left(coalesce(p_comment, ''), 1000))
  returning id into v_rating;

  perform public.notify(v_ratee, 'review', 'Nouvelle évaluation', null,
    '/profile', jsonb_build_object('transaction_id', p_transaction_id));

  return v_rating;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. Bildirim yardımcıları
-- ---------------------------------------------------------------------
create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications
     set read_at = now()
   where user_id = auth.uid()
     and read_at is null
     and (p_ids is null or id = any(p_ids));
$$;

create or replace function public.unread_counts()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'notifications', (
      select count(*) from public.notifications
       where user_id = auth.uid() and read_at is null
    ),
    'messages', (
      select coalesce(sum(
        case when buyer_id = auth.uid() then buyer_unread else seller_unread end
      ), 0)
      from public.conversations
      where buyer_id = auth.uid() or seller_id = auth.uid()
    )
  );
$$;

-- ---------------------------------------------------------------------
-- 9. İşlem listesi (ilan ve karşı taraf bilgisiyle birlikte)
-- ---------------------------------------------------------------------
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
  i_rated        boolean
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
      (case when t.notes ~ '^\s*\{' then (t.notes::jsonb->'confirmed') @> to_jsonb(auth.uid()::text) else false end),
      false
    ),
    exists (select 1 from public.ratings r where r.transaction_id = t.id and r.rater_id = auth.uid())
  from public.transactions t
  join public.listings l on l.id = t.listing_id
  join public.profiles c
    on c.id = case when t.buyer_id = auth.uid() then t.seller_id else t.buyer_id end
  left join public.deposits d on d.transaction_id = t.id
  where t.buyer_id = auth.uid() or t.seller_id = auth.uid()
  order by t.created_at desc
  limit greatest(1, least(p_limit, 100));
$$;

-- ---------------------------------------------------------------------
-- 10. Bir ilana gelen takas teklifleri (ilan sahibi için)
-- ---------------------------------------------------------------------
create or replace function public.my_swap_offers(p_limit integer default 50)
returns table (
  id                 uuid,
  listing_id         uuid,
  listing_title      text,
  listing_slug       text,
  offered_listing_id uuid,
  offered_title      text,
  offered_slug       text,
  offered_image      text,
  offered_text       text,
  cash_adjust_cents  integer,
  status             swap_offer_status,
  created_at         timestamptz,
  is_mine            boolean,
  sender_id          uuid,
  sender_name        text,
  sender_avatar      text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.listing_id,
    l.title,
    l.slug,
    e.offered_listing_id,
    ol.title,
    ol.slug,
    (select i.path from public.listing_images i
      where i.listing_id = e.offered_listing_id order by i.is_primary desc, i.position asc limit 1),
    e.offered_text,
    e.cash_adjust_cents,
    e.status,
    e.created_at,
    (e.offered_by = auth.uid()) as is_mine,
    p.id,
    p.display_name,
    p.avatar_url
  from public.exchanges e
  join public.listings l on l.id = e.listing_id
  left join public.listings ol on ol.id = e.offered_listing_id
  join public.profiles p on p.id = e.offered_by
  where e.offered_by = auth.uid() or l.owner_id = auth.uid()
  order by e.created_at desc
  limit greatest(1, least(p_limit, 100));
$$;

-- ---------------------------------------------------------------------
-- 11. Bir kullanıcının aldığı değerlendirmeler
-- ---------------------------------------------------------------------
create or replace function public.user_ratings(p_user_id uuid, p_limit integer default 20)
returns table (
  id          uuid,
  score       smallint,
  comment     text,
  created_at  timestamptz,
  rater_name  text,
  rater_avatar text,
  kind        transaction_kind
)
language sql
stable
set search_path = public
as $$
  select r.id, r.score, r.comment, r.created_at, p.display_name, p.avatar_url, t.kind
  from public.ratings r
  join public.profiles p on p.id = r.rater_id
  join public.transactions t on t.id = r.transaction_id
  where r.ratee_id = p_user_id
  order by r.created_at desc
  limit greatest(1, least(p_limit, 50));
$$;
