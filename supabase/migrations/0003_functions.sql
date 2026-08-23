-- =====================================================================
-- VOISINI — 0003_functions.sql
-- Uygulamanın çağırdığı RPC fonksiyonları (arama, mesajlaşma, istatistik)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Konum bulanıklaştırma: tam adres asla yayınlanmaz
-- ---------------------------------------------------------------------
create or replace function public.fuzz_point(p_lat double precision, p_lng double precision, p_meters integer default 300)
returns extensions.geography
language plpgsql
immutable
set search_path = public, extensions
as $$
declare
  angle double precision := random() * 2 * pi();
  dist  double precision := sqrt(random()) * p_meters;
  dlat  double precision := (dist * cos(angle)) / 111320.0;
  dlng  double precision := (dist * sin(angle)) / (111320.0 * cos(radians(p_lat)));
begin
  return st_setsrid(st_makepoint(p_lng + dlng, p_lat + dlat), 4326)::geography;
end;
$$;

-- ---------------------------------------------------------------------
-- search_listings — konum + filtre + metin araması, mesafeye göre
-- ---------------------------------------------------------------------
create or replace function public.search_listings(
  p_lat            double precision default null,
  p_lng            double precision default null,
  p_radius_m       integer default 25000,
  p_types          text[] default null,
  p_category       text default null,
  p_query          text default null,
  p_min_price      integer default null,
  p_max_price      integer default null,
  p_condition      text default null,
  p_sort           text default 'distance',
  p_limit          integer default 24,
  p_offset         integer default 0
)
returns table (
  id               uuid,
  slug             text,
  title            text,
  type             listing_type,
  status           listing_status,
  price_cents      integer,
  rent_price_cents integer,
  rent_period      rent_period,
  deposit_cents    integer,
  currency         text,
  condition        item_condition,
  city             text,
  postal_code      text,
  distance_m       double precision,
  favorite_count   integer,
  created_at       timestamptz,
  published_at     timestamptz,
  image_path       text,
  category_slug    text,
  owner_id         uuid,
  owner_name       text,
  owner_avatar     text,
  owner_rating     numeric,
  owner_rating_count integer,
  owner_verified   boolean,
  total_count      bigint
)
language sql
stable
set search_path = public, extensions
as $$
  with origin as (
    select case
      when p_lat is null or p_lng is null then null
      else st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
    end as g
  ),
  base as (
    select
      l.*,
      case when o.g is null or l.geo is null then null else st_distance(l.geo, o.g) end as dist
    from public.listings l
    cross join origin o
    join public.profiles p on p.id = l.owner_id
    left join public.categories c on c.id = l.category_id
    where l.status = 'active'
      and (o.g is null or l.geo is null or st_dwithin(l.geo, o.g, p_radius_m))
      and (p_types is null or l.type::text = any(p_types))
      and (p_category is null or c.slug = p_category)
      and (p_condition is null or l.condition::text = p_condition)
      and (p_min_price is null or coalesce(l.price_cents, l.rent_price_cents, 0) >= p_min_price)
      and (p_max_price is null or coalesce(l.price_cents, l.rent_price_cents, 0) <= p_max_price)
      and (
        p_query is null or p_query = ''
        or l.search_vector @@ plainto_tsquery('simple', p_query)
        or l.title ilike '%' || p_query || '%'
      )
  ),
  counted as (select count(*) as n from base)
  select
    b.id, b.slug, b.title, b.type, b.status,
    b.price_cents, b.rent_price_cents, b.rent_period, b.deposit_cents, b.currency,
    b.condition, b.city, b.postal_code,
    b.dist as distance_m,
    b.favorite_count, b.created_at, b.published_at,
    (select i.path from public.listing_images i
      where i.listing_id = b.id order by i.is_primary desc, i.position asc limit 1) as image_path,
    (select c2.slug from public.categories c2 where c2.id = b.category_id) as category_slug,
    pr.id as owner_id,
    pr.display_name as owner_name,
    pr.avatar_url as owner_avatar,
    pr.rating_avg as owner_rating,
    pr.rating_count as owner_rating_count,
    (pr.email_verified and (pr.phone_verified or pr.identity_verified)) as owner_verified,
    counted.n as total_count
  from base b
  join public.profiles pr on pr.id = b.owner_id
  cross join counted
  order by
    case when p_sort = 'distance' then b.dist end asc nulls last,
    case when p_sort = 'recent' then b.published_at end desc nulls last,
    case when p_sort = 'price_asc' then coalesce(b.price_cents, b.rent_price_cents, 0) end asc,
    case when p_sort = 'price_desc' then coalesce(b.price_cents, b.rent_price_cents, 0) end desc,
    b.published_at desc
  limit greatest(1, least(p_limit, 60))
  offset greatest(0, p_offset);
$$;

-- ---------------------------------------------------------------------
-- İlan görüntülenme sayacı
-- ---------------------------------------------------------------------
create or replace function public.increment_listing_view(p_listing_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.listings set view_count = view_count + 1 where id = p_listing_id;
$$;

-- ---------------------------------------------------------------------
-- Sohbet başlat / getir
-- ---------------------------------------------------------------------
create or replace function public.start_conversation(p_listing_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller uuid;
  v_buyer  uuid := auth.uid();
  v_id     uuid;
begin
  if v_buyer is null then
    raise exception 'not_authenticated';
  end if;
  if public.is_banned(v_buyer) then
    raise exception 'account_suspended';
  end if;

  select owner_id into v_seller from public.listings where id = p_listing_id;
  if v_seller is null then
    raise exception 'listing_not_found';
  end if;
  if v_seller = v_buyer then
    raise exception 'cannot_message_self';
  end if;
  if public.blocked_between(v_buyer, v_seller) then
    raise exception 'blocked';
  end if;

  select id into v_id from public.conversations
   where listing_id = p_listing_id and buyer_id = v_buyer and seller_id = v_seller;

  if v_id is null then
    insert into public.conversations (listing_id, buyer_id, seller_id)
    values (p_listing_id, v_buyer, v_seller)
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Mesaj gönder (sayaç + bildirim ile birlikte, tek atomik işlem)
-- ---------------------------------------------------------------------
create or replace function public.send_message(p_conversation_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_conv public.conversations%rowtype;
  v_other uuid;
  v_msg uuid;
begin
  if v_me is null then raise exception 'not_authenticated'; end if;
  if public.is_banned(v_me) then raise exception 'account_suspended'; end if;
  if char_length(coalesce(p_body, '')) = 0 then raise exception 'empty_message'; end if;

  select * into v_conv from public.conversations where id = p_conversation_id;
  if v_conv.id is null then raise exception 'conversation_not_found'; end if;
  if v_me <> v_conv.buyer_id and v_me <> v_conv.seller_id then raise exception 'forbidden'; end if;
  if public.blocked_between(v_conv.buyer_id, v_conv.seller_id) then raise exception 'blocked'; end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (p_conversation_id, v_me, left(p_body, 4000))
  returning id into v_msg;

  v_other := case when v_me = v_conv.buyer_id then v_conv.seller_id else v_conv.buyer_id end;

  update public.conversations
     set last_message = left(p_body, 160),
         last_message_at = now(),
         buyer_unread = case when v_other = v_conv.buyer_id then buyer_unread + 1 else buyer_unread end,
         seller_unread = case when v_other = v_conv.seller_id then seller_unread + 1 else seller_unread end,
         buyer_archived = false,
         seller_archived = false
   where id = p_conversation_id;

  insert into public.notifications (user_id, kind, title, body, url, data)
  values (
    v_other, 'message', 'Yeni mesaj', left(p_body, 120),
    '/messages/' || p_conversation_id::text,
    jsonb_build_object('conversation_id', p_conversation_id)
  );

  return v_msg;
end;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  update public.conversations
     set buyer_unread  = case when buyer_id = v_me then 0 else buyer_unread end,
         seller_unread = case when seller_id = v_me then 0 else seller_unread end
   where id = p_conversation_id and (buyer_id = v_me or seller_id = v_me);

  update public.messages
     set read_at = now()
   where conversation_id = p_conversation_id
     and sender_id <> v_me
     and read_at is null;
end;
$$;

-- ---------------------------------------------------------------------
-- Basit hız sınırlama (rate limit) — sunucu tarafından çağrılır
-- ---------------------------------------------------------------------
create or replace function public.check_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count integer;
begin
  insert into public.rate_limits (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set count = public.rate_limits.count + 1
  returning count into v_count;

  delete from public.rate_limits where window_start < now() - interval '1 day';
  return v_count <= p_max;
end;
$$;

-- ---------------------------------------------------------------------
-- Admin dashboard istatistikleri
-- ---------------------------------------------------------------------
create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select jsonb_build_object(
    'users_total',       (select count(*) from public.profiles),
    'users_active_30d',  (select count(*) from public.profiles where last_seen_at > now() - interval '30 days'),
    'users_banned',      (select count(*) from public.profiles where is_banned),
    'listings_total',    (select count(*) from public.listings),
    'listings_active',   (select count(*) from public.listings where status = 'active'),
    'listings_by_type',  (select coalesce(jsonb_object_agg(type, n), '{}'::jsonb)
                            from (select type, count(*) n from public.listings where status = 'active' group by type) t),
    'transactions_total',(select count(*) from public.transactions),
    'sales',             (select count(*) from public.transactions where kind = 'sale' and status = 'completed'),
    'rentals',           (select count(*) from public.transactions where kind = 'rental' and status = 'completed'),
    'swaps',             (select count(*) from public.transactions where kind = 'swap' and status = 'completed'),
    'gifts',             (select count(*) from public.transactions where kind = 'gift' and status = 'completed'),
    'reports_open',      (select count(*) from public.reports where status = 'open'),
    'disputes_open',     (select count(*) from public.disputes where status in ('open','under_review')),
    'deposits_held',     (select coalesce(sum(amount_cents - released_cents), 0) from public.deposits where status in ('authorized','captured')),
    'signups_7d',        (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'n', n) order by d), '[]'::jsonb)
                            from (select date_trunc('day', created_at) d, count(*) n
                                    from public.profiles
                                   where created_at > now() - interval '7 days'
                                   group by 1) s)
  ) into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------
-- Admin işlemi kaydı
-- ---------------------------------------------------------------------
create or replace function public.log_admin_action(
  p_action text, p_target_type text, p_target_id uuid, p_reason text default null, p_metadata jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  insert into public.admin_actions (admin_id, action, target_type, target_id, reason, metadata)
  values (auth.uid(), p_action, p_target_type, p_target_id, p_reason, p_metadata);
end;
$$;

-- ---------------------------------------------------------------------
-- Realtime yayınları
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.notifications;
