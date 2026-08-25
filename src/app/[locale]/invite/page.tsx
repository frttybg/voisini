import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { getCurrentProfile, userClient } from "@/lib/supabase/server";
import { InvitePanel } from "@/components/profile/InvitePanel";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(isLocale(locale) ? locale : "fr");
  return { title: t.invite.title, robots: { index: false, follow: false } };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "fr") as Locale;

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/${locale}/login?next=/${locale}/invite`);

  const { client } = await userClient();
  const { data } = await client.rpc<{ code: string | null; joined: number } | null>("my_invite");

  return <InvitePanel code={data?.code ?? ""} joined={Number(data?.joined ?? 0)} />;
}
