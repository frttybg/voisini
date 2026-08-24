import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { getCurrentProfile } from "@/lib/supabase/server";
import { fetchSavedSearches } from "@/lib/actions/alerts";
import { AlertsPanel } from "@/components/listings/AlertsPanel";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(isLocale(locale) ? locale : "fr");
  return { title: t.alerts.title, robots: { index: false, follow: false } };
}

export default async function AlertsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "fr") as Locale;

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/${locale}/login?next=/${locale}/alerts`);

  const searches = await fetchSavedSearches();
  return <AlertsPanel searches={searches} locale={locale} />;
}
