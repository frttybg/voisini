import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { getCurrentProfile } from "@/lib/supabase/server";
import {
  DEFAULT_LOCATION,
  getCategories,
  getFavoriteIds,
  getPlatformStats,
  imageUrl,
  searchListings,
} from "@/lib/data/listings";
import { formatDistance, formatPrice } from "@/lib/utils";
import { Hero, type HeroCard } from "@/components/home/Hero";
import { DiscoverIntro, MeetSection } from "@/components/home/Story";
import { TypesScroll } from "@/components/home/TypesScroll";
import { Categories } from "@/components/home/Categories";
import { NearbySection } from "@/components/home/NearbySection";
import { Community, FinalCTA, HowItWorks, Trust } from "@/components/home/Sections";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "fr") as Locale;
  const t = getDictionary(locale);

  const profile = await getCurrentProfile();

  const [{ items: nearby, total }, categories, favorites, stats] = await Promise.all([
    searchListings({
      lat: DEFAULT_LOCATION.lat,
      lng: DEFAULT_LOCATION.lng,
      radius: profile?.search_radius_m ?? 50000,
      sort: "recent",
      limit: 12,
    }),
    getCategories(),
    getFavoriteIds(),
    getPlatformStats(),
  ]);

  const images = Object.fromEntries(nearby.map((l) => [l.id, imageUrl(l.image_path)]));

  function priceLabel(listing: (typeof nearby)[number]) {
    if (listing.type === "give") return t.listing.free;
    if (listing.type === "rent" && listing.rent_price_cents !== null) {
      return `${formatPrice(listing.rent_price_cents, locale)}/${
        listing.rent_period ? t.periods[listing.rent_period].slice(0, 1) : ""
      }`;
    }
    if (listing.type === "sell" && listing.price_cents !== null) {
      return formatPrice(listing.price_cents, locale);
    }
    return t.types[listing.type].short;
  }

  /**
   * Hero'daki yüzen kartlar gerçek yakın ilanlardan beslenir.
   * Veritabanı henüz boşsa, tasarımın anlaşılması için örnek
   * (illüstratif) kartlar gösterilir — bunlar tıklanabilir değildir.
   */
  const heroCards: HeroCard[] = nearby.length
    ? nearby.slice(0, 5).map((l) => ({
        title: l.title,
        priceLabel: priceLabel(l),
        type: l.type,
        distance: formatDistance(l.distance_m, locale),
        categorySlug: l.category_slug ?? "other",
        imageUrl: images[l.id] ?? null,
      }))
    : [
        { title: t.hero.searchPlaceholder.split(",")[0], priceLabel: "120 €", type: "sell", distance: "850 m", categorySlug: "sports", imageUrl: null },
        { title: t.types.give.label, priceLabel: t.listing.free, type: "give", distance: "1.2 km", categorySlug: "furniture", imageUrl: null },
        { title: t.types.rent.label, priceLabel: `12 €/${t.periods.day.slice(0, 1)}`, type: "rent", distance: "600 m", categorySlug: "tools", imageUrl: null },
        { title: t.types.swap.label, priceLabel: "1:1", type: "swap", distance: "2.4 km", categorySlug: "books", imageUrl: null },
        { title: t.types.lend.label, priceLabel: "3 j", type: "lend", distance: "400 m", categorySlug: "hobby", imageUrl: null },
      ];

  const discoverSamples = (nearby.length ? nearby.slice(0, 4) : []).map((l) => ({
    title: l.title,
    distance: formatDistance(l.distance_m, locale) ?? l.city ?? "",
    typeLabel: t.types[l.type].short,
    type: l.type as string,
    price: priceLabel(l),
  }));

  const fallbackSamples = [
    { title: t.hero.searchPlaceholder.split(",")[0], distance: "850 m", typeLabel: t.types.sell.short, type: "sell", price: "120 €" },
    { title: t.types.give.label, distance: "1.2 km", typeLabel: t.types.give.short, type: "give", price: t.listing.free },
    { title: t.types.rent.label, distance: "600 m", typeLabel: t.types.rent.short, type: "rent", price: `12 €/${t.periods.day.slice(0, 1)}` },
    { title: t.types.swap.label, distance: "2.4 km", typeLabel: t.types.swap.short, type: "swap", price: "1:1" },
  ];

  const people = [
    { name: "Amélie", distance: "500 m", rating: 4.9, avatar: null },
    { name: "Mehmet", distance: "1.2 km", rating: 4.8, avatar: null },
    { name: "Chloé", distance: "2.1 km", rating: 5.0, avatar: null },
    { name: "Karim", distance: "3 km", rating: 4.7, avatar: null },
  ];

  const categoryItems = categories.map((c) => ({
    slug: c.slug,
    name: (c[`name_${locale}` as keyof typeof c] as string) ?? c.name_fr,
    color: c.color,
  }));

  return (
    <>
      <Hero cards={heroCards} liveCount={total} />
      <DiscoverIntro samples={discoverSamples.length ? discoverSamples : fallbackSamples} />
      <TypesScroll />
      <MeetSection people={people} />
      {categoryItems.length ? <Categories categories={categoryItems} /> : null}
      <NearbySection
        listings={nearby}
        images={images}
        favorites={[...favorites]}
        authenticated={Boolean(profile)}
        locationLabel={profile?.city ?? null}
      />
      <HowItWorks />
      <Trust />
      <Community stats={stats} />
      <FinalCTA />
    </>
  );
}
