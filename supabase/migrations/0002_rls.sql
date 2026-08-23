-- =====================================================================
-- VOISINI — 0002_rls.sql
-- Row Level Security: her kullanıcı yalnızca kendi verisini değiştirebilir
-- =====================================================================

-- Yardımcı fonksiyonlar -------------------------------------------------
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = uid and role in ('admin', 'moderator'));
$$;

create or replace function public.is_full_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = uid and role = 'admin');
$$;

create or replace function public.is_banned(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and is_banned = true
      and (banned_until is null or banned_until > now())
  );
$$;

create or replace function public.blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

-- RLS aç ---------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.addresses       enable row level security;
alter table public.categories      enable row level security;
alter table public.listings        enable row level security;
alter table public.listing_images  enable row level security;
alter table public.favorites       enable row level security;
alter table public.conversations   enable row level security;
alter table public.messages        enable row level security;
alter table public.transactions    enable row level security;
alter table public.payments        enable row level security;
alter table public.deposits        enable row level security;
alter table public.rentals         enable row level security;
alter table public.loans           enable row level security;
alter table public.exchanges       enable row level security;
alter table public.ratings         enable row level security;
alter table public.notifications   enable row level security;
alter table public.reports         enable row level security;
alter table public.blocks          enable row level security;
alter table public.verifications   enable row level security;
alter table public.disputes        enable row level security;
alter table public.admin_actions   enable row level security;
alter table public.audit_logs      enable row level security;
alter table public.rate_limits     enable row level security;

-- profiles -------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- addresses (tamamen özel) ---------------------------------------------
drop policy if exists addresses_own on public.addresses;
create policy addresses_own on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- categories -----------------------------------------------------------
drop policy if exists categories_select on public.categories;
create policy categories_select on public.categories
  for select using (is_active or public.is_admin());

drop policy if exists categories_admin on public.categories;
create policy categories_admin on public.categories
  for all using (public.is_full_admin()) with check (public.is_full_admin());

-- listings -------------------------------------------------------------
drop policy if exists listings_select_public on public.listings;
create policy listings_select_public on public.listings
  for select using (
    (status in ('active', 'reserved') and not public.is_banned(owner_id))
    or owner_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists listings_insert_own on public.listings;
create policy listings_insert_own on public.listings
  for insert with check (owner_id = auth.uid() and not public.is_banned());

drop policy if exists listings_update_own on public.listings;
create policy listings_update_own on public.listings
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists listings_delete_own on public.listings;
create policy listings_delete_own on public.listings
  for delete using (owner_id = auth.uid());

drop policy if exists listings_admin on public.listings;
create policy listings_admin on public.listings
  for all using (public.is_admin()) with check (public.is_admin());

-- listing_images -------------------------------------------------------
drop policy if exists listing_images_select on public.listing_images;
create policy listing_images_select on public.listing_images
  for select using (
    exists (select 1 from public.listings l where l.id = listing_id)
  );

drop policy if exists listing_images_write_own on public.listing_images;
create policy listing_images_write_own on public.listing_images
  for all using (
    exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid())
    or public.is_admin()
  );

-- favorites ------------------------------------------------------------
drop policy if exists favorites_own on public.favorites;
create policy favorites_own on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- conversations --------------------------------------------------------
drop policy if exists conversations_participants on public.conversations;
create policy conversations_participants on public.conversations
  for select using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations
  for insert with check (
    buyer_id = auth.uid()
    and not public.is_banned()
    and not public.blocked_between(buyer_id, seller_id)
  );

drop policy if exists conversations_update on public.conversations;
create policy conversations_update on public.conversations
  for update using (buyer_id = auth.uid() or seller_id = auth.uid())
  with check (buyer_id = auth.uid() or seller_id = auth.uid());

-- messages -------------------------------------------------------------
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    ) or public.is_admin()
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid()
    and not public.is_banned()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
        and not public.blocked_between(c.buyer_id, c.seller_id)
    )
  );

drop policy if exists messages_update_read on public.messages;
create policy messages_update_read on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- transactions ---------------------------------------------------------
drop policy if exists transactions_parties on public.transactions;
create policy transactions_parties on public.transactions
  for select using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

drop policy if exists transactions_insert on public.transactions;
create policy transactions_insert on public.transactions
  for insert with check (buyer_id = auth.uid() and not public.is_banned());

drop policy if exists transactions_update on public.transactions;
create policy transactions_update on public.transactions
  for update using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin())
  with check (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

-- payments / deposits (yalnızca okuma; yazma service_role ile) ----------
drop policy if exists payments_parties_select on public.payments;
create policy payments_parties_select on public.payments
  for select using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    ) or public.is_admin()
  );

drop policy if exists deposits_parties_select on public.deposits;
create policy deposits_parties_select on public.deposits
  for select using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    ) or public.is_admin()
  );

-- rentals / loans ------------------------------------------------------
drop policy if exists rentals_parties on public.rentals;
create policy rentals_parties on public.rentals
  for all using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    ) or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    ) or public.is_admin()
  );

drop policy if exists loans_parties on public.loans;
create policy loans_parties on public.loans
  for all using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    ) or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    ) or public.is_admin()
  );

-- exchanges ------------------------------------------------------------
drop policy if exists exchanges_visible on public.exchanges;
create policy exchanges_visible on public.exchanges
  for select using (
    offered_by = auth.uid()
    or exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists exchanges_insert on public.exchanges;
create policy exchanges_insert on public.exchanges
  for insert with check (offered_by = auth.uid() and not public.is_banned());

drop policy if exists exchanges_update on public.exchanges;
create policy exchanges_update on public.exchanges
  for update using (
    offered_by = auth.uid()
    or exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid())
  );

-- ratings --------------------------------------------------------------
drop policy if exists ratings_select on public.ratings;
create policy ratings_select on public.ratings
  for select using (true);

drop policy if exists ratings_insert on public.ratings;
create policy ratings_insert on public.ratings
  for insert with check (
    rater_id = auth.uid()
    and exists (
      select 1 from public.transactions t
      where t.id = transaction_id
        and t.status = 'completed'
        and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
        and (t.buyer_id = ratee_id or t.seller_id = ratee_id)
    )
  );

drop policy if exists ratings_admin on public.ratings;
create policy ratings_admin on public.ratings
  for all using (public.is_admin()) with check (public.is_admin());

-- notifications --------------------------------------------------------
drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reports --------------------------------------------------------------
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports
  for insert with check (reporter_id = auth.uid());

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own on public.reports
  for select using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists reports_admin on public.reports;
create policy reports_admin on public.reports
  for all using (public.is_admin()) with check (public.is_admin());

-- blocks ---------------------------------------------------------------
drop policy if exists blocks_own on public.blocks;
create policy blocks_own on public.blocks
  for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- verifications --------------------------------------------------------
drop policy if exists verifications_own on public.verifications;
create policy verifications_own on public.verifications
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists verifications_insert on public.verifications;
create policy verifications_insert on public.verifications
  for insert with check (user_id = auth.uid());

drop policy if exists verifications_admin on public.verifications;
create policy verifications_admin on public.verifications
  for all using (public.is_admin()) with check (public.is_admin());

-- disputes -------------------------------------------------------------
drop policy if exists disputes_parties on public.disputes;
create policy disputes_parties on public.disputes
  for select using (
    opened_by = auth.uid()
    or exists (
      select 1 from public.transactions t
      where t.id = transaction_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
    or public.is_admin()
  );

drop policy if exists disputes_insert on public.disputes;
create policy disputes_insert on public.disputes
  for insert with check (opened_by = auth.uid());

drop policy if exists disputes_admin on public.disputes;
create policy disputes_admin on public.disputes
  for all using (public.is_admin()) with check (public.is_admin());

-- admin_actions / audit_logs / rate_limits -----------------------------
drop policy if exists admin_actions_admin on public.admin_actions;
create policy admin_actions_admin on public.admin_actions
  for select using (public.is_admin());

drop policy if exists audit_logs_admin on public.audit_logs;
create policy audit_logs_admin on public.audit_logs
  for select using (public.is_admin());

-- rate_limits: yalnızca service_role erişir (politika yok = kapalı)

-- ---------------------------------------------------------------------
-- Storage bucket'ları ve politikaları
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('listings', 'listings', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "listing images public read" on storage.objects;
create policy "listing images public read" on storage.objects
  for select using (bucket_id in ('listings', 'avatars'));

drop policy if exists "listing images owner write" on storage.objects;
create policy "listing images owner write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('listings', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "listing images owner delete" on storage.objects;
create policy "listing images owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('listings', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
