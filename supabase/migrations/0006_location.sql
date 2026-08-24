-- ---------------------------------------------------------------------
-- 0006 — Kullanıcının kayıtlı yaklaşık konumu
--
-- profiles.geo bir PostGIS noktası olduğu için REST üzerinden doğrudan
-- okunamıyor. Bu fonksiyon, oturum açmış kullanıcının kendi konumunu
-- {lat, lng} olarak döndürür; böylece arama sayfaları varsayılan merkez
-- olarak Paris yerine kullanıcının kendi semtini kullanabilir.
--
-- Yalnızca çağıranın kendi satırını okur (auth.uid()), başkasının
-- konumunu döndürmez.
-- ---------------------------------------------------------------------

create or replace function public.my_location()
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
  select case
    when p.geo is null then null
    else jsonb_build_object(
      'lat', st_y(p.geo::geometry),
      'lng', st_x(p.geo::geometry)
    )
  end
  from public.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.my_location() from public;
grant execute on function public.my_location() to authenticated;
