-- ---------------------------------------------------------------------
-- 0009 — Anlaşmazlık akışı
--
-- Veritabanında disputes tablosu ve yönetim panelinde sayaç zaten vardı,
-- ama kullanıcının "bu işlemde sorun var" diyebileceği bir yol yoktu.
-- Burada üç parça ekleniyor:
--   open_dispute      — taraflardan biri sorun bildirir
--   resolve_dispute   — yönetici sonuçlandırır
--   admin_disputes    — yönetim paneli listesi
-- ---------------------------------------------------------------------

-- 1. Sorun bildir ------------------------------------------------------
create or replace function public.open_dispute(
  p_transaction_id uuid,
  p_reason         text,
  p_details        text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me    uuid := auth.uid();
  v_tx    public.transactions%rowtype;
  v_other uuid;
  v_id    uuid;
begin
  if v_me is null then raise exception 'not_authenticated'; end if;
  if public.is_banned(v_me) then raise exception 'account_suspended'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason_required'; end if;

  select * into v_tx from public.transactions where id = p_transaction_id;
  if v_tx.id is null then raise exception 'transaction_not_found'; end if;
  if v_me <> v_tx.buyer_id and v_me <> v_tx.seller_id then raise exception 'forbidden'; end if;

  -- Aynı işlem için açık bir kayıt varsa onu döndür
  select id into v_id
    from public.disputes
   where transaction_id = p_transaction_id
     and status in ('open', 'under_review');
  if v_id is not null then return v_id; end if;

  insert into public.disputes (transaction_id, opened_by, reason, details)
  values (p_transaction_id, v_me, left(trim(p_reason), 200), left(coalesce(p_details, ''), 2000))
  returning id into v_id;

  update public.transactions
     set status = 'disputed'
   where id = p_transaction_id
     and status not in ('completed', 'cancelled');

  v_other := case when v_me = v_tx.buyer_id then v_tx.seller_id else v_tx.buyer_id end;

  perform public.notify(
    v_other, 'system', 'Un litige a été ouvert', left(trim(p_reason), 200),
    '/deals', jsonb_build_object('transaction_id', p_transaction_id, 'dispute_id', v_id)
  );

  -- Yöneticilere haber ver
  perform public.notify(
    p.id, 'system', 'Nouveau litige', left(trim(p_reason), 200),
    '/admin', jsonb_build_object('dispute_id', v_id)
  )
  from public.profiles p
  where p.role in ('admin', 'moderator');

  return v_id;
end;
$$;

grant execute on function public.open_dispute(uuid, text, text) to authenticated;

-- 2. Yönetici sonuçlandırır -------------------------------------------
create or replace function public.resolve_dispute(
  p_dispute_id uuid,
  p_status     text,
  p_resolution text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_d  public.disputes%rowtype;
  v_tx public.transactions%rowtype;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('under_review', 'resolved', 'rejected') then
    raise exception 'invalid_status';
  end if;

  select * into v_d from public.disputes where id = p_dispute_id;
  if v_d.id is null then raise exception 'dispute_not_found'; end if;

  update public.disputes
     set status      = p_status::dispute_status,
         resolution  = left(coalesce(p_resolution, ''), 2000),
         resolved_by = case when p_status = 'under_review' then null else v_me end,
         resolved_at = case when p_status = 'under_review' then null else now() end,
         updated_at  = now()
   where id = p_dispute_id;

  select * into v_tx from public.transactions where id = v_d.transaction_id;

  -- Kapanan bir anlaşmazlıktan sonra işlem askıda kalmasın
  if p_status in ('resolved', 'rejected') and v_tx.status = 'disputed' then
    update public.transactions set status = 'cancelled' where id = v_tx.id;
    update public.listings set status = 'active'
     where id = v_tx.listing_id and status = 'reserved';
  end if;

  perform public.notify(
    u, 'system',
    case p_status
      when 'under_review' then 'Ton litige est en cours d''examen'
      when 'resolved'     then 'Ton litige a été résolu'
      else 'Ton litige a été clos'
    end,
    left(coalesce(p_resolution, ''), 200),
    '/deals', jsonb_build_object('dispute_id', p_dispute_id)
  )
  from unnest(array[v_tx.buyer_id, v_tx.seller_id]) as u;

  perform public.log_admin_action('dispute_' || p_status, 'dispute', p_dispute_id, p_resolution);
end;
$$;

grant execute on function public.resolve_dispute(uuid, text, text) to authenticated;

-- 3. Yönetim paneli listesi -------------------------------------------
create or replace function public.admin_disputes(p_limit integer default 50)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when not public.is_admin() then '[]'::jsonb else coalesce(
    (select jsonb_agg(row_to_json(d) order by d.created_at desc)
       from (
         select
           di.id,
           di.status::text        as status,
           di.reason,
           di.details,
           di.resolution,
           di.created_at,
           di.transaction_id,
           t.kind::text           as kind,
           t.status::text         as transaction_status,
           t.amount_cents,
           t.currency,
           l.title                as listing_title,
           l.slug                 as listing_slug,
           opener.display_name    as opened_by_name,
           buyer.display_name     as buyer_name,
           seller.display_name    as seller_name
         from public.disputes di
         join public.transactions t on t.id = di.transaction_id
         left join public.listings l on l.id = t.listing_id
         left join public.profiles opener on opener.id = di.opened_by
         left join public.profiles buyer  on buyer.id = t.buyer_id
         left join public.profiles seller on seller.id = t.seller_id
         order by di.created_at desc
         limit greatest(coalesce(p_limit, 50), 1)
       ) d),
    '[]'::jsonb) end;
$$;

grant execute on function public.admin_disputes(integer) to authenticated;

-- 4. Kullanıcının kendi işlemlerindeki anlaşmazlık durumu --------------
create or replace function public.my_disputes()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select jsonb_object_agg(di.transaction_id, jsonb_build_object(
        'id', di.id, 'status', di.status::text, 'reason', di.reason,
        'resolution', di.resolution, 'opened_by_me', di.opened_by = auth.uid()
     ))
     from public.disputes di
     join public.transactions t on t.id = di.transaction_id
     where auth.uid() in (t.buyer_id, t.seller_id)),
    '{}'::jsonb);
$$;

grant execute on function public.my_disputes() to authenticated;
