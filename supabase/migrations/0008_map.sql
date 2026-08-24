-- ---------------------------------------------------------------------
-- 0008 — Harita için ilan konumları
--
-- listings.geo bir PostGIS noktasıdır ve REST üzerinden okunamaz.
-- Bu fonksiyon, verilen ilanların koordinatlarını enlem/boylam olarak
-- döndürür.
--
-- GİZLİLİK: veritabanındaki koordinat zaten bilerek kaydırılmış
-- (yaklaşık) konumdur — ilan eklenirken gerçek nokta hiç kaydedilmez.
-- Dolayısıyla burada dönen değer kimsenin kapısını göstermez.
--
-- Fonksiyon SECURITY DEFINER DEĞİLDİR: çağıranın yetkileriyle çalışır,
-- yani satır düzeyi güvenlik kuralları aynen geçerlidir.
-- ---------------------------------------------------------------------

create or replace function public.listing_points(p_ids uuid[])
returns table (
  id  uuid,
  lat double precision,
  lng double precision
)
language sql
stable
set search_path = public, extensions
as $$
  select
    l.id,
    st_y(l.geo::geometry) as lat,
    st_x(l.geo::geometry) as lng
  from public.listings l
  where l.id = any(p_ids)
    and l.geo is not null
    and l.status in ('active', 'reserved');
$$;

grant execute on function public.listing_points(uuid[]) to anon;
grant execute on function public.listing_points(uuid[]) to authenticated;
