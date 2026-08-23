import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { getCurrentProfile, userClient } from "@/lib/supabase/server";
import { markConversationReadAction } from "@/lib/actions/messages";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Primitives";
import { ChatThread } from "@/components/messages/ChatThread";
import type { Message } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type ConversationRow = {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  listings: { title: string; slug: string } | null;
  buyer: { display_name: string; avatar_url: string | null } | null;
  seller: { display_name: string; avatar_url: string | null } | null;
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = (isLocale(raw) ? raw : "fr") as Locale;
  const t = getDictionary(locale);

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/${locale}/login?next=/${locale}/messages/${id}`);

  const { client } = await userClient();
  const { data: conversation } = await client
    .from<ConversationRow>("conversations")
    .select(
      "id,listing_id,buyer_id,seller_id," +
        "listings(title,slug)," +
        "buyer:profiles!conversations_buyer_id_fkey(display_name,avatar_url)," +
        "seller:profiles!conversations_seller_id_fkey(display_name,avatar_url)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!conversation) notFound();

  const { data: messages } = await client
    .from<Message[]>("messages")
    .select("id,conversation_id,sender_id,body,read_at,created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(200);

  await markConversationReadAction(id);

  const isBuyer = conversation.buyer_id === profile.id;
  const other = isBuyer ? conversation.seller : conversation.buyer;

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col px-0 sm:px-8">
      <header className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-3 sm:px-0">
        <Link
          href={`/${locale}/messages`}
          className="rounded-full p-2 text-[var(--ink-muted)] hover:bg-[var(--surface-sunken)]"
          aria-label={t.common.back}
        >
          <Icon name="chevronLeft" size={18} />
        </Link>
        <Avatar src={other?.avatar_url ?? null} name={other?.display_name ?? "?"} size={38} />
        <div className="min-w-0">
          <p className="truncate font-bold text-[var(--ink)]">{other?.display_name ?? "—"}</p>
          {conversation.listings?.slug ? (
            <Link
              href={`/${locale}/listings/${conversation.listings.slug}`}
              className="truncate text-[0.75rem] text-[var(--brand-600)] hover:underline"
            >
              {conversation.listings.title}
            </Link>
          ) : null}
        </div>
      </header>

      <ChatThread
        conversationId={id}
        currentUserId={profile.id}
        initialMessages={messages ?? []}
      />
    </div>
  );
}
