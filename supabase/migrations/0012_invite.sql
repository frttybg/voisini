-- ---------------------------------------------------------------------
-- 0012 — Davet bağlantısı
--
-- Her üyeye kısa bir davet kodu verilir. Bu kodla gelen kişi kaydolunca
-- kimin davet ettiği kaydedilir. Mahalle sitesinde büyümenin tek gerçek
-- yolu ağızdan ağıza; bu onu görünür kılar.
-- ---------------------------------------------------------------------

alter table public.profiles
  add column if not exists invite_code text,
  add column if not exists invited_by uuid references public.profiles(id) on delete set null;

-- Karışması kolay harfler (0/O, 1/I) dışarıda bırakıldı
create or replace function public.gen_invite_code()
returns text
language plpgsql
as $$
declare
  v_chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code  text;
  v_try   integer := 0;
begin
  loop
    v_code := '';
    for i in 1..7 loop
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where invite_code = v_code);
    v_try := v_try + 1;
    if v_try > 20 then exit; end if;
  end loop;
  return v_code;
end;
$$;

-- Mevcut üyelere kod ver
update public.profiles
   set invite_code = public.gen_invite_code()
 where invite_code is null;

create unique index if not exists profiles_invite_code_idx
  on public.profiles (invite_code);
create index if not exists profiles_invited_by_idx
  on public.profiles (invited_by);

-- ---------------------------------------------------------------------
-- Yeni üye: kod üret, davet edeni yaz
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref     text := nullif(trim(new.raw_user_meta_data->>'ref'), '');
  v_inviter uuid;
begin
  if v_ref is not null then
    select id into v_inviter
      from public.profiles
     where invite_code = upper(v_ref)
     limit 1;
  end if;

  insert into public.profiles (id, display_name, locale, email_verified, invite_code, invited_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'locale', 'fr'),
    new.email_confirmed_at is not null,
    public.gen_invite_code(),
    v_inviter
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Kendi davet bilgisi
-- ---------------------------------------------------------------------
create or replace function public.my_invite()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'code',   p.invite_code,
    'joined', (select count(*) from public.profiles i where i.invited_by = p.id)
  )
  from public.profiles p
  where p.id = auth.uid();
$$;

grant execute on function public.my_invite() to authenticated;

-- Davet kodu gizli bir bilgi değil ama yine de yalnızca sahibinin
-- okuyabildiği bir alan: profiles üzerindeki mevcut RLS kuralları
-- geçerli, kod yalnızca my_invite() ile kendi satırından okunuyor.
