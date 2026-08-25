-- ---------------------------------------------------------------------
-- 0013 — "Aranıyor" ilan türü (YALNIZCA bu satır)
--
-- PostgreSQL'de bir enum'a yeni değer eklendikten sonra, o değer aynı
-- işlem (transaction) içinde KULLANILAMAZ. Bu yüzden değer eklemesi
-- kendi başına, ayrı bir sorgu olarak çalıştırılmalı; onu kullanan her
-- şey 0014 dosyasında.
-- ---------------------------------------------------------------------

alter type listing_type add value if not exists 'want';
