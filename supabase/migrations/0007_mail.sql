-- ---------------------------------------------------------------------
-- 0007 — E-posta bildirimleri için alıcı bilgisi
--
-- Üyenin e-posta adresi auth.users tablosunda durur ve REST üzerinden
-- okunamaz. Bu fonksiyon yalnızca sunucu tarafındaki servis anahtarına
-- açıktır; bildirim gönderirken alıcının adresini, dilini ve bildirim
-- tercihini tek seferde verir.
--
-- Kullanıcıların birbirinin e-posta adresini görmesi mümkün değildir:
-- yetki yalnızca service_role'a verilmiştir.
-- ---------------------------------------------------------------------

create or replace function public.mail_target(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'email',     u.email,
    'name',      coalesce(nullif(p.display_name, ''), split_part(u.email, '@', 1)),
    'locale',    coalesce(nullif(p.locale, ''), 'fr'),
    'opted_in',  coalesce(p.email_notifications, true),
    'banned',    coalesce(p.is_banned, false)
  )
  from auth.users u
  join public.profiles p on p.id = u.id
  where u.id = p_user
    and u.email is not null;
$$;

revoke all on function public.mail_target(uuid) from public;
revoke all on function public.mail_target(uuid) from anon;
revoke all on function public.mail_target(uuid) from authenticated;
grant execute on function public.mail_target(uuid) to service_role;
