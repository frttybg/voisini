import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { getCurrentProfile } from "@/lib/supabase/server";
import { fetchNotifications } from "@/lib/actions/notifications";
import { NotificationList } from "@/components/notifications/NotificationList";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "fr") as Locale;

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/${locale}/login?next=/${locale}/notifications`);

  const items = await fetchNotifications(50);
  return <NotificationList items={items} />;
}
