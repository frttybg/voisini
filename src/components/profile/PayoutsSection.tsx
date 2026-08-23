"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Overlay";
import {
  openPayoutDashboardAction,
  refreshPayoutStatusAction,
  startConnectOnboardingAction,
} from "@/lib/actions/payments";

export function PayoutsSection({
  enabled,
  payoutsEnabled,
  hasAccount,
}: {
  /** Platformda Stripe anahtarları tanımlı mı */
  enabled: boolean;
  payoutsEnabled: boolean;
  hasAccount: boolean;
}) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Stripe onboarding'den dönüşte durumu tazele
  useEffect(() => {
    if (params.get("payouts") === "return") {
      startTransition(async () => {
        await refreshPayoutStatusAction();
        router.replace(`/${locale}/profile`);
        router.refresh();
      });
    }
  }, [params, router, locale]);

  function onboard() {
    startTransition(async () => {
      const result = await startConnectOnboardingAction(locale);
      const url = result.data?.url as string | undefined;
      if (!result.ok || !url) {
        toast(result.message === "paymentsDisabled" ? t.payments.disabled : t.common.error, "error");
        return;
      }
      window.location.href = url;
    });
  }

  function refresh() {
    startTransition(async () => {
      const result = await refreshPayoutStatusAction();
      if (!result.ok) {
        toast(t.common.error, "error");
        return;
      }
      toast(t.common.saved, "success");
      router.refresh();
    });
  }

  function dashboard() {
    startTransition(async () => {
      const result = await openPayoutDashboardAction();
      const url = result.data?.url as string | undefined;
      if (!result.ok || !url) {
        toast(t.common.error, "error");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--line)] p-5">
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <h2 className="text-[0.9375rem] font-bold text-[var(--ink)]">{t.payments.payouts}</h2>
        {payoutsEnabled ? (
          <Badge tone="success" size="sm" icon="badgeCheck">
            {t.payments.payoutsActive}
          </Badge>
        ) : hasAccount ? (
          <Badge tone="warning" size="sm" icon="clock">
            {t.payments.payoutsPending}
          </Badge>
        ) : null}
      </header>

      <p className="mb-4 text-[0.8125rem] leading-relaxed text-[var(--ink-muted)]">
        {enabled ? t.payments.payoutsText : t.payments.disabled}
      </p>

      {enabled ? (
        <div className="flex flex-wrap gap-2">
          {payoutsEnabled ? (
            <>
              <Button size="sm" variant="outline" icon="euro" loading={pending} onClick={dashboard}>
                {t.payments.payoutsDashboard}
              </Button>
              <Button size="sm" variant="ghost" loading={pending} onClick={refresh}>
                {t.payments.payoutsRefresh}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" icon="shieldCheck" loading={pending} onClick={onboard}>
                {hasAccount ? t.payments.payoutsPending : t.payments.payoutsSetup}
              </Button>
              {hasAccount ? (
                <Button size="sm" variant="ghost" loading={pending} onClick={refresh}>
                  {t.payments.payoutsRefresh}
                </Button>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <p className="mt-3 inline-flex items-center gap-1.5 text-[0.75rem] text-[var(--ink-muted)]">
        <Icon name="shield" size={12} />
        {t.payments.securedBy}
      </p>
    </section>
  );
}
