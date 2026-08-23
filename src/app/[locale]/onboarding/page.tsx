import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { getCurrentProfile } from "@/lib/supabase/server";
import { getCategories } from "@/lib/data/listings";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "fr") as Locale;

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/${locale}/login?next=/${locale}/onboarding`);

  const categories = await getCategories();

  return (
    <OnboardingFlow
      initialStep={Math.max(profile.onboarding_step + 1, 1)}
      displayName={profile.display_name}
      emailVerified={profile.email_verified}
      categories={categories.map((c) => ({
        slug: c.slug,
        name: (c[`name_${locale}` as keyof typeof c] as string) ?? c.name_fr,
        color: c.color,
      }))}
    />
  );
}
