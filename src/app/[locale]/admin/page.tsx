import { notFound, redirect } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { getCurrentProfile, userClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { fetchDisputes } from "@/lib/actions/admin";
import type { AdminStats } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type ReportRow = {
  id: string;
  target: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter: { display_name: string } | null;
};

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "fr") as Locale;
  const t = getDictionary(locale);

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/${locale}/login?next=/${locale}/admin`);
  if (profile.role !== "admin" && profile.role !== "moderator") notFound();

  const { client } = await userClient();

  const [{ data: stats }, { data: reports }, disputes] = await Promise.all([
    client.rpc<AdminStats>("admin_dashboard"),
    client
      .from<ReportRow[]>("reports")
      .select(
        "id,target,target_id,reason,details,status,created_at," +
          "reporter:profiles!reports_reporter_id_fkey(display_name)",
      )
      .in("status", ["open", "reviewing"])
      .order("created_at", { ascending: false })
      .limit(40),
    fetchDisputes(),
  ]);

  return (
    <AdminDashboard
      stats={stats}
      reports={reports ?? []}
      disputes={disputes}
      title={t.nav.admin}
      role={profile.role}
    />
  );
}
