-- ---------------------------------------------------------------------
-- 0014 — "Aranıyor" ilanlarının kuralları
--
-- Bu tür ilanda ortada satılacak bir eşya yok: kişi aradığı şeyi
-- yazıyor, elinde olan komşu ona ulaşıyor. Dolayısıyla üzerinden işlem
-- (satın alma, kiralama, ödünç, takas) başlatılamaz.
--
-- Arayüzde zaten düğme gösterilmiyor; burada veritabanı düzeyinde de
-- kapatıyoruz ki adresle uğraşan biri de başlatamasın.
-- ---------------------------------------------------------------------

create or replace function public.block_want_transactions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.listings l
     where l.id = new.listing_id and l.type = 'want'
  ) then
    raise exception 'want_listing_not_transactable';
  end if;
  return new;
end;
$$;

drop trigger if exists transactions_block_want on public.transactions;
create trigger transactions_block_want
  before insert on public.transactions
  for each row execute function public.block_want_transactions();

drop trigger if exists exchanges_block_want on public.exchanges;
create trigger exchanges_block_want
  before insert on public.exchanges
  for each row execute function public.block_want_transactions();
