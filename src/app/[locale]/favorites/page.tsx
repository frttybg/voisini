import { redirect } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { getCurrentProfile } from "@/lib/supabase/server";
import { getFavoriteListings, imageUrl } from "@/lib/data/listings";
import { FavoritesGrid } from "@/components/listings/FavoritesGrid";

export const dynamic = "force-dynamic";

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "fr") as Locale;
  const t = getDictionary(locale);

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/${locale}/login?next=/${locale}/favorites`);

  const listings = await getFavoriteListings();
  const images = Object.fromEntries(listings.map((l) => [l.id, imageUrl(l.image_path)]));

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 pb-24 pt-10 sm:px-8">
      <h1 className="display-sm mb-8 text-[var(--ink)]">{t.nav.favorites}</h1>
      <FavoritesGrid listings={listings} images={images} />
    </div>
  );
}
