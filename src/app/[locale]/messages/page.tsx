import Link from "next/link";
import { redirect } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { getCurrentProfile, userClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/utils";
import { Avatar, EmptyState } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

type ConversationRow = {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  last_message_at: string | null;
  buyer_unread: number;
  seller_unread: number;
  listings: { title: string; slug: string } | null;
  buyer: { display_name: string; avatar_url: string | null } | null;
  seller: { display_name: string; avatar_url: string | null } | null;
};

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "fr") as Locale;
  const t = getDictionary(locale);

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/${locale}/login?next=/${locale}/messages`);

  const { client } = await userClient();
  const { data } = await client
    .from<ConversationRow[]>("conversations")
    .select(
      "id,listing_id,buyer_id,seller_id,last_message,last_message_at,buyer_unread,seller_unread," +
        "listings(title,slug)," +
        "buyer:profiles!conversations_buyer_id_fkey(display_name,avatar_url)," +
        "seller:profiles!conversations_seller_id_fkey(display_name,avatar_url)",
    )
    .or(`buyer_id.eq.${profile.id},seller_id.eq.${profile.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(60);

  const conversations = data ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-10 sm:px-8">
      <h1 className="display-sm mb-8 text-[var(--ink)]">{t.nav.messages}</h1>

      {conversations.length ? (
        <ul className="flex flex-col divide-y divide-[var(--line)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)]">
          {conversations.map((c) => {
            const isBuyer = c.buyer_id === profile.id;
            const other = isBuyer ? c.seller : c.buyer;
            const unread = isBuyer ? c.buyer_unread : c.seller_unread;
            return (
              <li key={c.id}>
                <Link
                  href={`/${locale}/messages/${c.id}`}
                  className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-[var(--surface-sunken)]"
                >
                  <Avatar src={other?.avatar_url ?? null} name={other?.display_name ?? "?"} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="truncate font-bold text-[var(--ink)]">
                        {other?.display_name ?? "—"}
                      </p>
                      <span className="ms-auto shrink-0 text-[0.75rem] text-[var(--ink-muted)]">
                        {formatRelativeTime(c.last_message_at, locale)}
                      </span>
                    </div>
                    {c.listings?.title ? (
                      <p className="truncate text-[0.75rem] text-[var(--brand-600)]">
                        {c.listings.title}
                      </p>
                    ) : null}
                    <p className="truncate text-[0.8125rem] text-[var(--ink-muted)]">
                      {c.last_message ?? "—"}
                    </p>
                  </div>
                  {unread > 0 ? (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--brand-600)] px-1.5 text-[0.6875rem] font-bold text-white">
                      {unread}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon="message"
          title={t.common.emptyTitle}
          text={t.how.step2Text}
          action={
            <Button href={`/${locale}/listings`} icon="compass">
              {t.nav.discover}
            </Button>
          }
        />
      )}
    </div>
  );
}
