-- ---------------------------------------------------------------------
-- 0011 — Arama alarmı (kayıtlı arama)
--
-- Kullanıcı bir aramayı kaydeder; o aramaya uyan yeni bir ilan
-- yayınlandığında günlük görev ona e-posta gönderir. Bugün bir şey
-- bulamayan kişi boş dönmez, kayıt bırakır.
-- ---------------------------------------------------------------------

create table if not exists public.saved_searches (
  id               uuid primary key default extensions.uuid_generate_v4(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  label            text not null default '',
  q                text,
  types            text[],
  category         text,
  condition        text,
  min_price        integer,
  max_price        integer,
  radius_m         integer not null default 25000,
  geo              extensions.geography(Point, 4326),
  place            text,
  is_active        boolean not null default true,
  last_notified_at timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create index if not exists saved_searches_user_idx on public.saved_searches (user_id);
create index if not exists saved_searches_geo_idx on public.saved_searches using gist (geo);

alter table public.saved_searches enable row level security;

drop policy if exists saved_searches_own on public.saved_searches;
create policy saved_searches_own on public.saved_searches
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Kaydet
-- ---------------------------------------------------------------------
create or replace function public.save_search(
  p_label     text,
  p_q         text default null,
  p_type      text default null,
  p_category  text default null,
  p_condition text default null,
  p_min       integer default null,
  p_max       integer default null,
  p_radius    integer default 25000,
  p_lat       double precision default null,
  p_lng       double precision default null,
  p_place     text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
  v_count integer;
begin
  if v_me is null then raise exception 'not_authenticated'; end if;

  select count(*) into v_count from public.saved_searches where user_id = v_me;
  if v_count >= 20 then raise exception 'too_many_searches'; end if;

  insert into public.saved_searches (
    user_id, label, q, types, category, condition, min_price, max_price,
    radius_m, geo, place
  )
  values (
    v_me,
    left(coalesce(nullif(trim(p_label), ''), coalesce(p_q, 'Voisini')), 80),
    nullif(trim(coalesce(p_q, '')), ''),
    case when p_type is null or p_type = '' then null else array[p_type] end,
    nullif(p_category, ''),
    nullif(p_condition, ''),
    p_min, p_max,
    greatest(coalesce(p_radius, 25000), 1000),
    case when p_lat is null or p_lng is null then null
         else st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography end,
    left(coalesce(p_place, ''), 120)
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.save_search(text, text, text, text, text, integer, integer, integer, double precision, double precision, text) to authenticated;

-- ---------------------------------------------------------------------
-- Listele / sil
-- ---------------------------------------------------------------------
create or replace function public.my_searches()
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce(jsonb_agg(row_to_json(s) order by s.created_at desc), '[]'::jsonb)
  from (
    select
      ss.id, ss.label, ss.q, ss.types, ss.category, ss.condition,
      ss.min_price, ss.max_price, ss.radius_m, ss.place, ss.created_at,
      case when ss.geo is null then null else st_y(ss.geo::geometry) end as lat,
      case when ss.geo is null then null else st_x(ss.geo::geometry) end as lng
    from public.saved_searches ss
    where ss.user_id = auth.uid()
    order by ss.created_at desc
  ) s;
$$;

grant execute on function public.my_searches() to authenticated;

create or replace function public.delete_search(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.saved_searches where id = p_id and user_id = auth.uid();
$$;

grant execute on function public.delete_search(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Günlük görev: eşleşen yeni ilanlar
--
-- Her kayıtlı arama için, son bildirimden bu yana yayınlanan ve
-- ölçütlere uyan ilanlar. Seçtikten sonra zaman damgası güncellenir ki
-- aynı ilan iki kez bildirilmesin.
-- ---------------------------------------------------------------------
create or replace function public.pending_search_alerts(p_limit integer default 300)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_rows jsonb;
begin
  with hits as (
    select
      ss.id        as search_id,
      ss.user_id,
      ss.label,
      count(l.id)  as new_count,
      (array_agg(l.title order by l.published_at desc))[1:3] as samples
    from public.saved_searches ss
    join public.listings l
      on l.status = 'active'
     and l.owner_id <> ss.user_id
     and l.published_at > greatest(ss.last_notified_at, now() - interval '7 days')
     and (ss.geo is null or l.geo is null or st_dwithin(l.geo, ss.geo, ss.radius_m))
     and (ss.types is null or l.type::text = any(ss.types))
     and (ss.condition is null or l.condition::text = ss.condition)
     and (ss.min_price is null or coalesce(l.price_cents, l.rent_price_cents, 0) >= ss.min_price)
     and (ss.max_price is null or coalesce(l.price_cents, l.rent_price_cents, 0) <= ss.max_price)
     and (
       ss.category is null
       or exists (select 1 from public.categories c
                   where c.id = l.category_id and c.slug = ss.category)
     )
     and (
       ss.q is null or ss.q = ''
       or l.search_vector @@ plainto_tsquery('simple', ss.q)
       or l.title ilike '%' || ss.q || '%'
     )
    where ss.is_active
    group by ss.id, ss.user_id, ss.label
    having count(l.id) > 0
    limit greatest(coalesce(p_limit, 300), 1)
  )
  select coalesce(jsonb_agg(row_to_json(hits)), '[]'::jsonb) into v_rows from hits;

  update public.saved_searches
     set last_notified_at = now()
   where id in (select (value ->> 'search_id')::uuid from jsonb_array_elements(v_rows));

  return v_rows;
end;
$$;

revoke all on function public.pending_search_alerts(integer) from public;
revoke all on function public.pending_search_alerts(integer) from anon;
revoke all on function public.pending_search_alerts(integer) from authenticated;
grant execute on function public.pending_search_alerts(integer) to service_role;
