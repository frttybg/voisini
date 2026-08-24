"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Overlay";
import { deleteSearchAction, type SavedSearch } from "@/lib/actions/alerts";
import { formatDistance } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

export function AlertsPanel({
  searches,
  locale,
}: {
  searches: SavedSearch[];
  locale: Locale;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  const visible = searches.filter((s) => !removed.has(s.id));

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteSearchAction(id);
      if (!result.ok) {
        toast(t.common.error, "error");
        return;
      }
      setRemoved((prev) => new Set(prev).add(id));
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-10 sm:px-8">
      <h1 className="display-sm mb-2 text-[var(--ink)]">{t.alerts.title}</h1>
      <p className="mb-8 text-sm text-[var(--ink-muted)]">{t.alerts.emptyText}</p>

      {visible.length ? (
        <ul className="flex flex-col gap-3">
          {visible.map((search) => {
            const bits = [
              search.place,
              search.types?.length ? t.types[search.types[0] as keyof typeof t.types]?.short : null,
              search.category,
              t.alerts.within.replace(
                "{radius}",
                formatDistance(search.radius_m, locale) ?? "",
              ),
            ].filter(Boolean);

            return (
              <li
                key={search.id}
                className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-600)]">
                  <Icon name="bell" size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--ink)]">{search.label}</p>
                  <p className="truncate text-[0.75rem] text-[var(--ink-muted)]">
                    {bits.join(" · ")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  icon="trash"
                  disabled={pending}
                  onClick={() => remove(search.id)}
                >
                  <span className="sr-only sm:not-sr-only">{t.alerts.delete}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon="bell" title={t.alerts.empty} text={t.alerts.emptyText} />
      )}
    </div>
  );
}
