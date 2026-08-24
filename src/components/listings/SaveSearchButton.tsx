"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Overlay";
import { saveSearchAction } from "@/lib/actions/alerts";
import { idleState } from "@/lib/actions/state";
import { useActionSuccess } from "@/lib/useActionSuccess";

/**
 * "Alarm kur" — o anki süzgeçleri kaydeder. Eşleşen yeni bir ilan
 * yayınlandığında kullanıcıya e-posta gider.
 */
export function SaveSearchButton({
  authenticated,
  locale,
  fallbackLat,
  fallbackLng,
}: {
  authenticated: boolean;
  locale: string;
  fallbackLat: number;
  fallbackLng: number;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const params = useSearchParams();
  const [state, formAction, pending] = useActionState(saveSearchAction, idleState);

  useActionSuccess(state, () => toast(t.alerts.saved, "success"));

  if (!authenticated) {
    return (
      <Button
        href={`/${locale}/login?next=/${locale}/listings`}
        variant="ghost"
        size="sm"
        icon="bell"
      >
        {t.alerts.save}
      </Button>
    );
  }

  const one = (key: string) => params.get(key) ?? "";
  const label =
    one("q") ||
    one("place") ||
    [one("type"), one("category")].filter(Boolean).join(" · ") ||
    t.nav.discover;

  return (
    <div className="flex items-center gap-2">
      <form action={formAction}>
        {[
          ["label", label],
          ["q", one("q")],
          ["type", one("type")],
          ["category", one("category")],
          ["condition", one("condition")],
          ["min", one("min")],
          ["max", one("max")],
          ["radius", one("radius") || "25000"],
          ["place", one("place")],
          ["lat", one("lat") || String(fallbackLat)],
          ["lng", one("lng") || String(fallbackLng)],
        ].map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <Button type="submit" variant="ghost" size="sm" icon="bell" loading={pending}>
          {t.alerts.save}
        </Button>
      </form>

      {state.message === "tooMany" ? (
        <span className="text-[0.75rem] text-[var(--danger)]">{t.alerts.limit}</span>
      ) : (
        <Link
          href={`/${locale}/alerts`}
          className="text-[0.8125rem] text-[var(--ink-muted)] transition-colors hover:text-[var(--brand-600)]"
        >
          {t.alerts.mine}
        </Link>
      )}
    </div>
  );
}
