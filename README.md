# Voisini

**Sat • Ver • Ödünç ver • Kirala • Takas et** — konum tabanlı topluluk marketplace'i.

Next.js 16 (App Router) + TypeScript + Tailwind v4 + Supabase (PostgreSQL + PostGIS + Auth + Storage).
**Ek npm bağımlılığı yoktur** — Supabase istemcisi, doğrulama katmanı, ikonlar ve animasyonlar
projenin içinde yazılmıştır. Mevcut `node_modules` ile `npm run dev` doğrudan çalışır.

---

## 1. Kurulum (15 dakika, ücretsiz)

### 1.1 Supabase projesi aç

1. https://supabase.com → **Start your project** (kredi kartı gerekmez).
2. Yeni proje: bölge olarak **Europe (Paris / Frankfurt)** seç — Fransa'daki kullanıcılara en yakın.
3. Veritabanı şifreni güvenli bir yere kaydet.

### 1.2 Veritabanını kur

Supabase panelinde **SQL Editor**'ü aç ve şu dosyaları **sırayla** çalıştır:

| Sıra | Dosya | Ne yapar |
|---|---|---|
| 1 | `supabase/migrations/0001_schema.sql` | 24 tablo, tipler, indeksler, trigger'lar |
| 2 | `supabase/migrations/0002_rls.sql` | Row Level Security politikaları + storage bucket'ları |
| 3 | `supabase/migrations/0003_functions.sql` | Arama, mesajlaşma, istatistik fonksiyonları |
| 4 | `supabase/migrations/0004_transactions.sql` | İşlem döngüsü, takas teklifleri, puanlama, bildirim RPC'leri |
| 5 | `supabase/migrations/0005_payments.sql` | Stripe Connect alanları, webhook koruması, ayrıcalıklı alan kilidi |
| 6 | `supabase/seed.sql` | 13 kategori (6 dilde) |

> PostGIS uzantısı 0001 içinde otomatik açılır. Hata alırsan
> **Database → Extensions** bölümünden `postgis`'i elle etkinleştir ve tekrar dene.

### 1.3 Auth ayarları

**Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` (üretimde `https://voisini.com`)
- Redirect URLs: `http://localhost:3000/auth/callback` ve `https://voisini.com/auth/callback`

**Authentication → Providers → Email**: "Confirm email" açık kalsın (güvenlik için önerilir).

### 1.4 Ortam değişkenleri

```bash
cp .env.example .env.local
```

`.env.local` içini Supabase panelindeki **Project Settings → API** değerleriyle doldur:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 1.5 Çalıştır

```bash
npm install     # (node_modules zaten varsa gerekmez)
npm run dev
```

http://localhost:3000 → tarayıcı diline göre `/fr`, `/tr`, `/en`, `/de`, `/ar` veya `/es`'e yönlenir.

---

## 2. Yayına alma (Vercel — ücretsiz)

1. Projeyi GitHub'a gönder (`.env.local` gitmez, `.gitignore` içinde).
2. https://vercel.com → **Add New → Project** → repoyu seç.
3. **Environment Variables** bölümüne `.env.local` içindeki dört değişkeni ekle
   (`NEXT_PUBLIC_SITE_URL` = `https://voisini.com`).
4. Deploy.
5. Vercel → **Settings → Domains** → `voisini.com` ekle; alan adı sağlayıcında
   Vercel'in verdiği DNS kayıtlarını gir.
6. Supabase → Authentication → URL Configuration'a üretim adresini ekle.

Hosting maliyeti: **0 €** (Vercel Hobby + Supabase Free). Trafik büyüyünce
Supabase Pro (25 $/ay) ilk yükseltme adımı olur.

---

## 2b. Stripe ödeme kurulumu (isteğe bağlı ama önerilir)

Anahtarları girmezsen platform **elden ödeme** moduyla eksiksiz çalışır.
Online ödemeyi açmak için:

### 1. Stripe hesabı

1. https://dashboard.stripe.com/register — Fransa'yı ülke olarak seç.
2. Sağ üstteki **Test mode** açık kalsın; gerçek para akmadan her şeyi deneyebilirsin.
3. **Developers → API keys** → `sk_test_...` anahtarını kopyala → `.env.local` içindeki
   `STRIPE_SECRET_KEY` alanına yapıştır.

### 2. Connect'i etkinleştir

**Connect → Get started** → platform tipi olarak **Marketplace**, hesap tipi olarak
**Express** seç. Bu, satıcıların Voisini üzerinden doğrudan ödeme almasını sağlar.

### 3. Webhook

**Developers → Webhooks → Add endpoint**

- URL: `https://voisini.com/api/payments/webhook`
  (yerel geliştirme için: `stripe listen --forward-to localhost:3000/api/payments/webhook`)
- Dinlenecek olaylar:
  `checkout.session.completed`, `checkout.session.expired`,
  `payment_intent.payment_failed`, `charge.refunded`, `account.updated`
- Oluşan **Signing secret** (`whsec_...`) → `.env.local` içindeki `STRIPE_WEBHOOK_SECRET`

> Webhook imzası doğrulanmadan hiçbir ödeme verisi işlenmez ve her olay
> yalnızca bir kez uygulanır (`payment_events` tablosu).

### 4. Komisyon (isteğe bağlı)

`PLATFORM_FEE_BPS=250` → her satış/kiralamadan %2,5 platform payı.
Varsayılan `0` (komisyon yok).

### Para nasıl akıyor?

```
Alıcı  ──►  Stripe Checkout  ──►  satıcının Express hesabı   (satış / kira tutarı − komisyon)
                             ──►  Voisini hesabı             (komisyon + depozito)
```

- **Kart bilgisi hiçbir zaman senin sunucuna uğramaz** — Stripe'ın barındırdığı
  sayfada kalır, PCI yükü Stripe'ta.
- **Depozito** platformda bekler; iki taraf da işlemi tamamladığında otomatik
  olarak alıcıya iade edilir.
- Satıcı ödeme alabilmek için profilinden **"Ödeme al"** kurulumunu tamamlar
  (Stripe kimlik doğrulaması). Tamamlanmamışsa ilan yine yayınlanır, sadece
  online ödeme yerine elden ödeme görünür.

> **Yasal not:** başkaları adına para tahsil etmek Fransa'da düzenlemeye tabidir.
> Stripe Connect Express bu yükün büyük kısmını (KYC, ödeme kuruluşu statüsü)
> Stripe'a devretmek için seçildi. Yine de kullanım koşullarını ve komisyon
> modelini yayına almadan önce bir muhasebeci/hukukçuya danışman doğru olur —
> ben hukuki danışman değilim.

---

## 3. Mimari

```
src/
├── app/
│   ├── [locale]/                # Tüm sayfalar dil önekiyle
│   │   ├── layout.tsx           # Kök layout (html/body, i18n, navbar)
│   │   ├── page.tsx             # Ana sayfa (scroll deneyimi)
│   │   ├── listings/            # Keşif + ilan detayı
│   │   ├── new/                 # 7 adımlı ilan sihirbazı
│   │   ├── messages/            # Sohbet listesi + konuşma
│   │   ├── favorites/ profile/ onboarding/ admin/
│   │   ├── login/ register/ forgot-password/ reset-password/
│   ├── api/geocode/             # Nominatim proxy (ücretsiz geocoding)
│   ├── api/upload/              # Güvenli görsel yükleme
│   ├── auth/callback/           # E-posta doğrulama dönüşü
│   ├── sitemap.ts robots.ts
├── components/                  # ui / layout / home / listings / messages / admin
├── lib/
│   ├── supabase/                # REST istemcisi, auth, oturum, tipler
│   ├── actions/                 # Server Actions (auth, listings, messages, profile, admin)
│   ├── i18n/                    # 6 dil sözlüğü + RTL
│   ├── data/                    # Sorgu yardımcıları
│   ├── utils.ts validation.ts env.ts
├── middleware.ts                # Dil algılama + oturum yenileme + korumalı yollar
supabase/                        # SQL şeması, RLS, fonksiyonlar, seed
```

### Neden kendi Supabase istemcisi?

`@supabase/supabase-js` yerine `src/lib/supabase/rest.ts` içinde ince bir
PostgREST istemcisi var (~300 satır). Sebep: sıfır ek bağımlılık, tam kontrol,
küçük paket boyutu. Güvenlik sınırı istemcide değil **veritabanındaki RLS
politikalarında** olduğu için bu tercih güvenliği azaltmaz.

---

## 4. Güvenlik ve gizlilik

- **RLS her tabloda açık.** Kullanıcı yalnızca kendi profilini, ilanlarını,
  favorilerini, mesajlarını değiştirebilir. `0002_rls.sql` tek referans noktasıdır.
- **Tam adres asla saklanmaz.** İlan kaydedilirken koordinat sunucuda
  ±150 m – ±1.5 km yarıçapında rastgele kaydırılır (`fuzzCoordinates`).
  Arama da bu bulanık nokta üzerinden yapılır.
- **Görsel yükleme:** dosya imzası (magic bytes) doğrulanır, uzantıya güvenilmez;
  boyut sınırı 4 MB; yol her zaman `<userId>/...` ve Storage politikası da bunu zorlar.
- **Hız sınırlama:** kayıt, giriş, şifre sıfırlama, ilan oluşturma, mesaj ve
  şikâyet işlemleri veritabanı tarafında sayaçlanır (`check_rate_limit`).
- **Şifreler** Supabase Auth (bcrypt) tarafından tutulur; uygulama şifre görmez.
- **Oturum** httpOnly çerezlerde; middleware süresi dolan token'ı yeniler.
- **XSS/CSRF:** kullanıcı metinlerinde HTML kaldırılır, Server Actions
  Next.js'in kendi CSRF korumasını kullanır, güvenlik başlıkları `next.config.ts`'de.

---

## 5. Şu an çalışan özellikler

- Gerçek kayıt / giriş / e-posta doğrulama / şifre sıfırlama
- 5 adımlı onboarding (profil, konum, ilgi alanları, doğrulama, başla)
- 7 adımlı ilan sihirbazı: çoklu fotoğraf (tarayıcıda sıkıştırma + sürükle-bırak
  + sıralama), 5 ilan türü ve türe özel alanlar, konum, önizleme, yayınlama
- PostGIS ile konum tabanlı arama: mesafe, tür, kategori, durum, fiyat, sıralama
- İlan detayı: galeri, satıcı kartı, doğrulama rozetleri, benzer ilanlar,
  yapılandırılmış veri (JSON-LD), Open Graph
- Favoriler, profil ve ayarlar, ilan yönetimi
- Mesajlaşma: ilan üzerinden sohbet başlatma, okundu bilgisi, bildirim kaydı
- **İşlem döngüsü:** talep gönder → satıcı kabul/ret → çift taraflı tamamlama onayı →
  puanlama. İlan durumu (aktif / rezerve / tamamlandı) otomatik güncellenir.
- **Takas teklifleri:** kendi ilanınla ya da serbest metinle teklif ver, nakit fark ekle;
  kabul / ret / geri çekme. Teklif kabul edilince diğer teklifler otomatik reddedilir.
- **Puanlama:** yalnızca tamamlanmış işlem sonrası, tek kez; profilde yıldız ortalaması
  ve yorumlar
- **Bildirim merkezi:** navbar'da okunmamış sayacı, bildirim listesi, okundu işaretleme
- **Online ödeme (Stripe Connect):** Checkout ile kart ödemesi, satıcıya doğrudan
  aktarım, platform komisyonu, depozito bloke + otomatik iade, imzalı webhook,
  satıcı için ödeme alma kurulumu ve kazanç paneli
- Şikâyet sistemi + admin paneli (gerçek istatistikler, şikâyet çözümleme,
  ilan kaldırma, kullanıcı engelleme/doğrulama)
- 6 dil + Arapça için tam RTL
- Açık/koyu/sistem teması, mobil alt navigasyon, `prefers-reduced-motion` desteği

## 6. Sonraki faz (hazır altyapı, entegrasyon bekliyor)

Şema, RLS ve tipler bu modüller için **hazır**; kalan iş sağlayıcı entegrasyonu:

| Modül | Durum |
|---|---|
| Kiralama/ödünç takibi | Kayıtlar oluşuyor ve iade tarihinde kapanıyor; otomatik iade hatırlatma e-postası eklenecek |
| Kısmi depozito kesintisi | Hasar durumunda depozitonun bir kısmını satıcıya aktarma; şu an tamamı iade ediliyor |
| Anlaşmazlık | `disputes` tablosu + admin akışı hazır; kullanıcı arayüzü eklenecek |
| Canlı mesajlaşma | Realtime yayınları açık; şu an 4 sn yoklama, WebSocket'e geçilebilir |
| Push bildirim | `notifications` tablosu ve merkez hazır; Web Push eklenecek |

## 7. Notlar

- Veritabanı boşken ana sayfadaki yüzen kartlar **illüstratif örneklerdir**
  (tıklanamaz). İlk gerçek ilan girildiği an yerlerini gerçek verilere bırakırlar.
- Yazı tipi olarak sistem yazı tipi yığını kullanılır (hızlı yükleme, sıfır istek).
  Özel bir yazı tipi istersen `src/app/globals.css` içindeki `--font-stack` değerini
  değiştirmen yeterli.
- Geocoding OpenStreetMap Nominatim üzerinden ücretsiz yapılır; günlük yüksek
  trafikte kendi Photon/Pelias sunucuna geçmen önerilir.

## 8. Komutlar

```bash
npm run dev        # geliştirme
npm run build      # üretim derlemesi
npm run start      # üretim sunucusu
npm run lint       # ESLint
npm run typecheck  # TypeScript kontrolü
```
