"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Primitives";
import { markNotificationsReadAction } from "@/lib/actions/notifications";
import type { NotificationKind, NotificationRow } from "@/lib/supabase/types";

const kindIcon: Record<NotificationKind, IconName> = {
  message: "message",
  offer: "swap",
  offer_accepted: "check",
  offer_declined: "close",
  favorite: "heart",
  review: "star",
  payment: "euro",
  rental_start: "key",
  rental_end: "clock",
  return_reminder: "clock",
  deposit: "shield",
  listing_approved: "badgeCheck",
  listing_removed: "flag",
  system: "info",
};

export function NotificationList({ items }: { items: NotificationRow[] }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const unread = items.filter((n) => !n.read_at).length;

  function markAll() {
    startTransition(async () => {
      await markNotificationsReadAction();
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-10 sm:px-8">
      <header className="mb-6 flex items-center gap-3">
        <h1 className="display-sm text-[var(--ink)]">{t.notifications.title}</h1>
        {unread > 0 ? (
          <Button size="sm" variant="ghost" loading={pending} onClick={markAll}>
            {t.notifications.markAllRead}
          </Button>
        ) : null}
      </header>

      {items.length ? (
        <ul className="flex flex-col divide-y divide-[var(--line)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)]">
          {items.map((item) => {
            const href = item.url ? `/${locale}${item.url}` : `/${locale}`;
            return (
              <li key={item.id}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-start gap-3 px-4 py-4 transition-colors hover:bg-[var(--surface-sunken)]",
                    !item.read_at && "bg-[var(--brand-50)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      item.read_at
                        ? "bg-[var(--surface-sunken)] text-[var(--ink-muted)]"
                        : "bg-[var(--brand-100)] text-[var(--brand-700)]",
                    )}
                  >
                    <Icon name={kindIcon[item.kind] ?? "info"} size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="truncate font-semibold text-[var(--ink)]">{item.title}</span>
                      <span className="ms-auto shrink-0 text-[0.75rem] text-[var(--ink-muted)]">
                        {formatRelativeTime(item.created_at, locale)}
                      </span>
                    </span>
                    {item.body ? (
                      <span className="mt-0.5 block truncate text-[0.8125rem] text-[var(--ink-muted)]">
                        {item.body}
                      </span>
                    ) : null}
                  </span>
                  {!item.read_at ? (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-500)]" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon="bell" title={t.notifications.empty} />
      )}
    </div>
  );
}
