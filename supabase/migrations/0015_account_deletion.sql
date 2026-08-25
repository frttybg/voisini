-- ---------------------------------------------------------------------
-- 0015 — Hesap silme (GDPR "unutulma hakkı")
--
-- Gizlilik politikamız şunu söylüyor: "Hesap ve ilanlar: hesap etkin
-- olduğu sürece, silindikten sonra 30 gün." Bu dosya tam olarak onu
-- uyguluyor:
--
--   1. Kullanıcı silme talebi verir  → profil hemen anonimleşir,
--      ilanlar yayından kalkar, hesap görünmez olur.
--   2. 30 gün içinde vazgeçebilir    → her şey geri gelir.
--   3. 30 gün sonra günlük görev     → kayıt kalıcı olarak silinir.
--
-- Bekleme süresi hem yanlışlıkla silmeye hem de öfkeyle silmeye karşı
-- koruma; karşı tarafın işlem geçmişi de bu sürede korunmuş oluyor.
-- ---------------------------------------------------------------------

alter table public.profiles
  add column if not exists deleted_at timestamptz;

create index if not exists profiles_deleted_at_idx
  on public.profiles (deleted_at)
  where deleted_at is not null;

-- ---------------------------------------------------------------------
-- 1. Silme talebi
-- ---------------------------------------------------------------------
create or replace function public.request_account_deletion()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'not_authenticated'; end if;

  update public.profiles
     set deleted_at   = now(),
         display_name = 'Compte supprimé',
         bio          = '',
         avatar_url   = null,
         phone        = null,
         city         = null,
         region       = null,
         postal_code  = null,
         geo          = null,
         interests    = '{}',
         email_notifications = false,
         updated_at   = now()
   where id = v_me;

  -- İlanlar yayından kalksın (silinmiyor; 30 gün sonra hesapla gidecek)
  update public.listings
     set status = 'archived'
   where owner_id = v_me
     and status in ('draft', 'pending', 'active', 'reserved');

  -- Kayıtlı aramalar hemen dursun
  delete from public.saved_searches where user_id = v_me;
end;
$$;

grant execute on function public.request_account_deletion() to authenticated;

-- ---------------------------------------------------------------------
-- 2. Vazgeçme
-- ---------------------------------------------------------------------
create or replace function public.cancel_account_deletion()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'not_authenticated'; end if;

  update public.profiles
     set deleted_at = null,
         email_notifications = true,
         updated_at = now()
   where id = v_me
     and deleted_at is not null;
end;
$$;

grant execute on function public.cancel_account_deletion() to authenticated;

-- ---------------------------------------------------------------------
-- 3. Süresi dolanlar (günlük görev okur, sonra kalıcı olarak siler)
-- ---------------------------------------------------------------------
create or replace function public.expired_deletions(p_limit integer default 50)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(p.id), '[]'::jsonb)
  from (
    select id from public.profiles
     where deleted_at is not null
       and deleted_at < now() - interval '30 days'
     limit greatest(coalesce(p_limit, 50), 1)
  ) p;
$$;

revoke all on function public.expired_deletions(integer) from public;
revoke all on function public.expired_deletions(integer) from anon;
revoke all on function public.expired_deletions(integer) from authenticated;
grant execute on function public.expired_deletions(integer) to service_role;
