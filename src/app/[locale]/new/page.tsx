import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { getCurrentProfile } from "@/lib/supabase/server";
import { getCategories } from "@/lib/data/listings";
import { ListingWizard } from "@/components/listings/ListingWizard";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(isLocale(locale) ? locale : "fr");
  return { title: t.listing.createTitle, robots: { index: false } };
}

export default async function NewListingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "fr") as Locale;

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/${locale}/login?next=/${locale}/new`);

  const categories = await getCategories();

  return (
    <ListingWizard
      defaultCity={profile.city}
      categories={categories.map((c) => ({
        slug: c.slug,
        name: (c[`name_${locale}` as keyof typeof c] as string) ?? c.name_fr,
      }))}
    />
  );
}
