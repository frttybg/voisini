-- ---------------------------------------------------------------------
-- 0010 — Günlük görevler için veri kaynakları
--
--   pending_return_reminders() — iade tarihi yaklaşan ödünç/kiralamalar
--   weekly_digest()            — kullanıcının çevresindeki yeni ilanlar
--
-- İkisi de yalnızca service_role'a açıktır; günlük görev sunucudan çalışır.
-- ---------------------------------------------------------------------

-- Kiralamada da "hatırlatma gönderildi mi" bilgisi tutalım
alter table public.rentals
  add column if not exists reminder_sent_at timestamptz;

-- ---------------------------------------------------------------------
-- 1. İade hatırlatmaları
--
-- İade gününe 24 saatten az kalanlar ya da günü geçmiş olanlar. Aynı
-- işlem için ikinci kez gönderilmesin diye seçerken işaretliyoruz.
-- ---------------------------------------------------------------------
create or replace function public.pending_return_reminders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows jsonb;
begin
  with due as (
    select
      t.id            as transaction_id,
      t.buyer_id,
      t.seller_id,
      t.kind::text    as kind,
      l.title         as listing_title,
      coalesce(ln.due_at, r.ends_at) as due_at,
      ln.id           as loan_id,
      r.id            as rental_id
    from public.transactions t
    left join public.loans   ln on ln.transaction_id = t.id
    left join public.rentals r  on r.transaction_id = t.id
    left join public.listings l on l.id = t.listing_id
    where t.status in ('accepted', 'in_progress', 'awaiting_return')
      and (
        (ln.id is not null and ln.returned_at is null and ln.reminder_sent_at is null
         and ln.due_at < now() + interval '24 hours')
        or
        (r.id is not null and r.returned_at is null and r.reminder_sent_at is null
         and r.ends_at < now() + interval '24 hours')
      )
    limit 200
  )
  select coalesce(jsonb_agg(to_jsonb(due) - 'loan_id' - 'rental_id'), '[]'::jsonb)
    into v_rows
    from due;

  update public.loans
     set reminder_sent_at = now()
   where id in (
     select ln.id from public.loans ln
     join public.transactions t on t.id = ln.transaction_id
     where t.status in ('accepted', 'in_progress', 'awaiting_return')
       and ln.returned_at is null and ln.reminder_sent_at is null
       and ln.due_at < now() + interval '24 hours'
   );

  update public.rentals
     set reminder_sent_at = now()
   where id in (
     select r.id from public.rentals r
     join public.transactions t on t.id = r.transaction_id
     where t.status in ('accepted', 'in_progress', 'awaiting_return')
       and r.returned_at is null and r.reminder_sent_at is null
       and r.ends_at < now() + interval '24 hours'
   );

  return v_rows;
end;
$$;

revoke all on function public.pending_return_reminders() from public;
revoke all on function public.pending_return_reminders() from anon;
revoke all on function public.pending_return_reminders() from authenticated;
grant execute on function public.pending_return_reminders() to service_role;

-- ---------------------------------------------------------------------
-- 2. Haftalık özet
--
-- Her kullanıcı için, kendi çevresinde son yedi günde yayına giren
-- ilanların sayısı ve birkaç örnek başlık. Kendi ilanları sayılmaz.
-- ---------------------------------------------------------------------
create or replace function public.weekly_digest(p_limit integer default 500)
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce(jsonb_agg(row_to_json(d)), '[]'::jsonb)
  from (
    select
      p.id as user_id,
      count(l.id) as new_count,
      (array_agg(l.title order by l.published_at desc))[1:3] as samples
    from public.profiles p
    join public.listings l
      on l.status = 'active'
     and l.owner_id <> p.id
     and l.published_at > now() - interval '7 days'
     and l.geo is not null
     and st_dwithin(l.geo, p.geo, coalesce(p.search_radius_m, 25000))
    where p.geo is not null
      and coalesce(p.email_notifications, true)
      and not coalesce(p.is_banned, false)
    group by p.id
    having count(l.id) > 0
    order by count(l.id) desc
    limit greatest(coalesce(p_limit, 500), 1)
  ) d;
$$;

revoke all on function public.weekly_digest(integer) from public;
revoke all on function public.weekly_digest(integer) from anon;
revoke all on function public.weekly_digest(integer) from authenticated;
grant execute on function public.weekly_digest(integer) to service_role;
