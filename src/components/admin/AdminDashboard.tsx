"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { cn, formatPrice, formatRelativeTime, listingTypeOrder } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Overlay";
import { removeListingAction, resolveReportAction } from "@/lib/actions/admin";
import type { AdminStats } from "@/lib/supabase/types";

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

export function AdminDashboard({
  stats,
  reports,
  title,
  role,
}: {
  stats: AdminStats | null;
  reports: ReportRow[];
  title: string;
  role: string;
}) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [handled, setHandled] = useState<Set<string>>(new Set());

  function resolve(reportId: string, status: "actioned" | "dismissed", targetId?: string) {
    startTransition(async () => {
      if (status === "actioned" && targetId) {
        await removeListingAction(targetId, "moderation");
      }
      const result = await resolveReportAction(reportId, status);
      if (!result.ok) {
        toast(t.common.error, "error");
        return;
      }
      setHandled((prev) => new Set(prev).add(reportId));
      toast(t.common.saved, "success");
    });
  }

  const tiles: { icon: IconName; label: string; value: string; tone?: string }[] = stats
    ? [
        { icon: "user", label: "Utilisateurs", value: String(stats.users_total) },
        { icon: "sparkles", label: "Actifs (30 j)", value: String(stats.users_active_30d) },
        { icon: "package", label: "Annonces actives", value: String(stats.listings_active) },
        { icon: "tag", label: "Ventes", value: String(stats.sales) },
        { icon: "key", label: "Locations", value: String(stats.rentals) },
        { icon: "swap", label: "Échanges", value: String(stats.swaps) },
        { icon: "gift", label: "Dons", value: String(stats.gifts) },
        { icon: "flag", label: "Signalements", value: String(stats.reports_open), tone: "danger" },
        { icon: "alert", label: "Litiges", value: String(stats.disputes_open), tone: "warning" },
        {
          icon: "shield",
          label: "Cautions détenues",
          value: formatPrice(stats.deposits_held, locale),
        },
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 pb-24 pt-10 sm:px-8">
      <header className="mb-8 flex items-center gap-3">
        <h1 className="display-sm text-[var(--ink)]">{title}</h1>
        <Badge tone="accent" icon="shield">
          {role}
        </Badge>
      </header>

      {stats ? (
        <>
          <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {tiles.map((tile) => (
              <div
                key={tile.label}
                className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-4"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)]",
                    tile.tone === "danger"
                      ? "bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] text-[var(--danger)]"
                      : tile.tone === "warning"
                        ? "bg-[color-mix(in_oklab,var(--warning)_14%,transparent)] text-[var(--warning)]"
                        : "bg-[var(--brand-50)] text-[var(--brand-600)]",
                  )}
                >
                  <Icon name={tile.icon} size={17} />
                </span>
                <span className="text-2xl font-extrabold tracking-[-0.02em] text-[var(--ink)]">
                  {tile.value}
                </span>
                <span className="text-[0.75rem] text-[var(--ink-muted)]">{tile.label}</span>
              </div>
            ))}
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
              {t.listing.typeTitle}
            </h2>
            <div className="flex flex-wrap gap-2">
              {listingTypeOrder.map((type) => (
                <span
                  key={type}
                  className="flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: `var(--type-${type})` }} />
                  <span className="font-semibold text-[var(--ink)]">{t.types[type].label}</span>
                  <span className="tabular-nums text-[var(--ink-muted)]">
                    {stats.listings_by_type?.[type] ?? 0}
                  </span>
                </span>
              ))}
            </div>
          </section>
        </>
      ) : (
        <p className="mb-8 text-sm text-[var(--ink-muted)]">{t.errors.notConfigured}</p>
      )}

      <section>
        <h2 className="mb-4 text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
          {t.listing.reportListing}
        </h2>

        {reports.filter((r) => !handled.has(r.id)).length ? (
          <ul className="flex flex-col gap-3">
            {reports
              .filter((r) => !handled.has(r.id))
              .map((report) => (
                <li
                  key={report.id}
                  className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge tone="danger" size="sm" icon="flag">
                        {report.reason}
                      </Badge>
                      <Badge tone="neutral" size="sm">
                        {report.target}
                      </Badge>
                      <span className="text-[0.75rem] text-[var(--ink-muted)]">
                        {formatRelativeTime(report.created_at, locale)} ·{" "}
                        {report.reporter?.display_name ?? "—"}
                      </span>
                    </div>
                    {report.details ? (
                      <p className="text-[0.8125rem] text-[var(--ink-soft)]">{report.details}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => resolve(report.id, "dismissed")}
                    >
                      {t.common.cancel}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={pending}
                      onClick={() =>
                        resolve(
                          report.id,
                          "actioned",
                          report.target === "listing" ? report.target_id : undefined,
                        )
                      }
                    >
                      {t.common.delete}
                    </Button>
                  </div>
                </li>
              ))}
          </ul>
        ) : (
          <EmptyState icon="shieldCheck" title={t.common.emptyTitle} />
        )}
      </section>
    </div>
  );
}
