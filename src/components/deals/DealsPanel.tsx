"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, formatDate, formatPrice, formatRelativeTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Avatar, Badge, EmptyState } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Overlay";
import { DisputeModal, RatingModal } from "./Modals";
import {
  cancelDealAction,
  completeDealAction,
  respondDealAction,
  respondSwapOfferAction,
} from "@/lib/actions/transactions";
import { startCheckoutAction } from "@/lib/actions/payments";
import type {
  DealRow,
  SwapOfferRow,
  TransactionStatus,
  SwapOfferStatus,
} from "@/lib/supabase/types";
import type { DisputeSummary } from "@/lib/supabase/types";

export function DealsPanel({
  deals,
  offers,
  images,
  offerImages,
  paymentResult,
  disputes,
}: {
  deals: DealRow[];
  offers: SwapOfferRow[];
  images: Record<string, string | null>;
  offerImages: Record<string, string | null>;
  paymentResult?: string | null;
  disputes: Record<string, DisputeSummary>;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [tab, setTab] = useState<"deals" | "offers">("deals");
  const [rating, setRating] = useState<DealRow | null>(null);
  const [dispute, setDispute] = useState<DealRow | null>(null);

  useEffect(() => {
    if (paymentResult === "success") toast(t.payments.success, "success");
    else if (paymentResult === "cancelled") toast(t.payments.cancelled, "info");
    // yalnızca ilk yüklemede
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentResult]);

  const pendingOffers = offers.filter((o) => o.status === "pending" && !o.is_mine).length;
  const pendingDeals = deals.filter((d) => d.status === "requested" && !d.is_buyer).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-10 sm:px-8">
      <h1 className="display-sm mb-6 text-[var(--ink)]">{t.deal.title}</h1>

      <div className="mb-6 flex gap-1 border-b border-[var(--line)]">
        <TabButton active={tab === "deals"} onClick={() => setTab("deals")} count={pendingDeals}>
          {t.deal.dealsTab}
        </TabButton>
        <TabButton active={tab === "offers"} onClick={() => setTab("offers")} count={pendingOffers}>
          {t.deal.offersTab}
        </TabButton>
      </div>

      {tab === "deals" ? (
        deals.length ? (
          <ul className="flex flex-col gap-3">
            {deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                imageUrl={images[deal.id] ?? null}
                onRate={() => setRating(deal)}
                onDispute={() => setDispute(deal)}
                dispute={disputes[deal.id] ?? null}
              />
            ))}
          </ul>
        ) : (
          <EmptyState icon="swap" title={t.deal.empty} text={t.how.step3Text} />
        )
      ) : offers.length ? (
        <ul className="flex flex-col gap-3">
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              imageUrl={offerImages[offer.id] ?? null}
            />
          ))}
        </ul>
      ) : (
        <EmptyState icon="swap" title={t.swapOffer.none} text={t.types.swap.tagline} />
      )}

      {rating ? (
        <RatingModal
          open
          onClose={() => setRating(null)}
          transactionId={rating.id}
          counterpartName={rating.counterpart_name}
        />
      ) : null}

      {dispute ? (
        <DisputeModal open onClose={() => setDispute(null)} transactionId={dispute.id} />
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
        active
          ? "border-[var(--brand-600)] text-[var(--ink)]"
          : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-soft)]",
      )}
    >
      {children}
      {count > 0 ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent-500)] px-1.5 text-[0.625rem] font-bold text-white">
          {count}
        </span>
      ) : null}
    </button>
  );
}

const statusTone: Record<TransactionStatus, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  requested: "warning",
  accepted: "brand",
  in_progress: "brand",
  awaiting_return: "warning",
  completed: "success",
  declined: "danger",
  cancelled: "neutral",
  disputed: "danger",
};

const kindIcon: Record<string, IconName> = {
  sale: "tag",
  rental: "key",
  loan: "clock",
  swap: "swap",
  gift: "gift",
};

function DealCard({
  deal,
  imageUrl,
  onRate,
  onDispute,
  dispute,
}: {
  deal: DealRow;
  imageUrl: string | null;
  onRate: () => void;
  onDispute: () => void;
  dispute: DisputeSummary | null;
}) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const statusLabel = {
    requested: t.deal.statusRequested,
    accepted: t.deal.statusAccepted,
    declined: t.deal.statusDeclined,
    cancelled: t.deal.statusCancelled,
    in_progress: t.deal.statusInProgress,
    awaiting_return: t.deal.statusInProgress,
    completed: t.deal.statusCompleted,
    disputed: t.deal.statusDisputed,
  }[deal.status];

  function run(fn: () => Promise<{ ok: boolean; message?: string }>) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast(t.common.error, "error");
        return;
      }
      toast(t.common.saved, "success");
      router.refresh();
    });
  }

  const canComplete =
    deal.status === "accepted" || deal.status === "in_progress" || deal.status === "awaiting_return";
  const canCancel = ["requested", "accepted", "in_progress", "awaiting_return"].includes(deal.status);

  const totalDue = deal.amount_cents + (deal.deposit_cents ?? 0);
  const isPaid = deal.payment_status === "captured" || deal.payment_status === "authorized";
  const canPay =
    deal.is_buyer &&
    totalDue > 0 &&
    !isPaid &&
    ["requested", "accepted", "in_progress"].includes(deal.status);

  function pay() {
    startTransition(async () => {
      const result = await startCheckoutAction(deal.id, locale);
      const url = result.data?.url as string | undefined;
      if (!result.ok || !url) {
        toast(
          result.message === "sellerNotReady"
            ? t.payments.sellerNotReady
            : result.message === "paymentsDisabled"
              ? t.payments.disabled
              : t.common.error,
          "error",
        );
        return;
      }
      window.location.href = url;
    });
  }

  return (
    <li className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-4">
      <div className="flex gap-3">
        <Link
          href={`/${locale}/listings/${deal.listing_slug}`}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-sunken)]"
        >
          {imageUrl ? (
            <Image src={imageUrl} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[var(--ink-muted)]">
              <Icon name={kindIcon[deal.kind] ?? "package"} size={20} />
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge tone={statusTone[deal.status]} size="sm">
              {statusLabel}
            </Badge>
            <Badge tone="neutral" size="sm" icon={kindIcon[deal.kind]}>
              {t.types[deal.listing_type].short}
            </Badge>
            <span className="text-[0.75rem] text-[var(--ink-muted)]">
              {deal.is_buyer ? t.deal.asBuyer : t.deal.asSeller}
            </span>
          </div>

          <Link
            href={`/${locale}/listings/${deal.listing_slug}`}
            className="block truncate font-bold text-[var(--ink)] hover:text-[var(--brand-700)]"
          >
            {deal.listing_title}
          </Link>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-[0.75rem] text-[var(--ink-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Avatar
                src={deal.counterpart_avatar}
                name={deal.counterpart_name}
                size={18}
              />
              {deal.counterpart_name}
            </span>
            {deal.amount_cents > 0 ? (
              <span className="font-semibold text-[var(--ink-soft)]">
                {formatPrice(deal.amount_cents, locale, deal.currency)}
              </span>
            ) : null}
            {deal.deposit_cents ? (
              <span className="inline-flex items-center gap-1">
                <Icon name="shield" size={12} />
                {formatPrice(deal.deposit_cents, locale, deal.currency)} {t.deal.depositHeld}
              </span>
            ) : null}
            {deal.starts_at ? (
              <span className="inline-flex items-center gap-1">
                <Icon name="clock" size={12} />
                {formatDate(deal.starts_at, locale)}
                {deal.ends_at ? ` → ${formatDate(deal.ends_at, locale)}` : ""}
              </span>
            ) : null}
            <span className="ms-auto">{formatRelativeTime(deal.created_at, locale)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isPaid ? (
          <Badge tone="success" size="sm" icon="check">
            {t.payments.paid}
          </Badge>
        ) : null}

        {canPay ? (
          deal.seller_payouts_enabled ? (
            <Button size="sm" icon="euro" disabled={pending} onClick={pay}>
              {t.payments.pay} · {formatPrice(totalDue, locale, deal.currency)}
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-[var(--ink-muted)]">
              <Icon name="info" size={14} />
              {t.payments.offline}
            </span>
          )
        ) : null}

        {deal.status === "requested" && !deal.is_buyer ? (
          <>
            <Button
              size="sm"
              disabled={pending}
              onClick={() => run(() => respondDealAction(deal.id, true))}
            >
              {t.deal.accept}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => run(() => respondDealAction(deal.id, false))}
            >
              {t.deal.decline}
            </Button>
          </>
        ) : null}

        {canComplete ? (
          deal.i_confirmed ? (
            <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-[var(--ink-muted)]">
              <Icon name="clock" size={14} />
              {t.deal.waitingOther}
            </span>
          ) : (
            <Button
              size="sm"
              icon="check"
              disabled={pending}
              onClick={() => run(() => completeDealAction(deal.id))}
            >
              {t.deal.complete}
            </Button>
          )
        ) : null}

        {deal.status === "completed" ? (
          deal.i_rated ? (
            <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-[var(--success)]">
              <Icon name="check" size={14} />
              {t.deal.rated}
            </span>
          ) : (
            <Button size="sm" icon="star" onClick={onRate}>
              {t.deal.rate}
            </Button>
          )
        ) : null}

        <Button
          size="sm"
          variant="ghost"
          href={`/${locale}/messages`}
          icon="message"
          className="ms-auto"
        >
          {t.nav.messages}
        </Button>

        {canCancel ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => run(() => cancelDealAction(deal.id))}
          >
            {t.deal.cancel}
          </Button>
        ) : null}

        {!dispute && deal.status !== "cancelled" && deal.status !== "declined" ? (
          <Button size="sm" variant="ghost" icon="flag" onClick={onDispute}>
            {t.dispute.open}
          </Button>
        ) : null}
      </div>

      {dispute ? (
        <div
          className="flex flex-col gap-1 rounded-[var(--radius-md)] px-3.5 py-3 text-[0.8125rem]"
          style={{
            background:
              dispute.status === "resolved"
                ? "color-mix(in oklab, var(--success) 10%, transparent)"
                : "color-mix(in oklab, var(--warning) 12%, transparent)",
          }}
        >
          <span className="flex items-center gap-1.5 font-semibold text-[var(--ink)]">
            <Icon name="flag" size={13} />
            {dispute.status === "open"
              ? t.dispute.statusOpen
              : dispute.status === "under_review"
                ? t.dispute.statusReview
                : dispute.status === "resolved"
                  ? t.dispute.statusResolved
                  : t.dispute.statusRejected}
          </span>
          <span className="text-[var(--ink-soft)]">{dispute.reason}</span>
          {dispute.resolution ? (
            <span className="text-[var(--ink-muted)]">{dispute.resolution}</span>
          ) : null}
        </div>
      ) : null}

      {deal.deposit_cents && deal.deposit_status !== "released" ? (
        <p className="flex items-start gap-1.5 text-[0.75rem] text-[var(--ink-muted)]">
          <Icon name="shield" size={13} className="mt-0.5 shrink-0" />
          {t.payments.depositHeldNote}
        </p>
      ) : null}

      {deal.deposit_status === "released" ? (
        <p className="flex items-center gap-1.5 text-[0.75rem] text-[var(--success)]">
          <Icon name="check" size={13} />
          {t.payments.depositReleased}
        </p>
      ) : null}

      {canComplete && !deal.i_confirmed ? (
        <p className="text-[0.75rem] text-[var(--ink-muted)]">{t.deal.confirmHint}</p>
      ) : null}
    </li>
  );
}

const offerTone: Record<SwapOfferStatus, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  pending: "warning",
  accepted: "success",
  declined: "danger",
  countered: "brand",
  withdrawn: "neutral",
};

function OfferCard({ offer, imageUrl }: { offer: SwapOfferRow; imageUrl: string | null }) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const statusLabel = {
    pending: t.deal.statusRequested,
    accepted: t.deal.statusAccepted,
    declined: t.deal.statusDeclined,
    countered: t.deal.statusInProgress,
    withdrawn: t.deal.statusCancelled,
  }[offer.status];

  function run(action: "accept" | "decline" | "withdraw") {
    startTransition(async () => {
      const result = await respondSwapOfferAction(offer.id, action);
      if (!result.ok) {
        toast(t.common.error, "error");
        return;
      }
      toast(t.common.saved, "success");
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={offerTone[offer.status]} size="sm">
          {statusLabel}
        </Badge>
        <span className="text-[0.75rem] text-[var(--ink-muted)]">
          {offer.is_mine ? t.swapOffer.mine : t.swapOffer.received}
        </span>
        <span className="ms-auto text-[0.75rem] text-[var(--ink-muted)]">
          {formatRelativeTime(offer.created_at, locale)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <span className="block text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--ink-muted)]">
            {t.swapOffer.title}
          </span>
          <div className="mt-1 flex items-center gap-2">
            {imageUrl ? (
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)]">
                <Image src={imageUrl} alt="" fill sizes="40px" className="object-cover" />
              </span>
            ) : null}
            <span className="min-w-0">
              <span className="block truncate text-[0.875rem] font-bold text-[var(--ink)]">
                {offer.offered_title ?? offer.offered_text ?? "—"}
              </span>
              {offer.cash_adjust_cents ? (
                <span className="text-[0.75rem] text-[var(--ink-muted)]">
                  + {formatPrice(offer.cash_adjust_cents, locale)}
                </span>
              ) : null}
            </span>
          </div>
        </div>

        <Icon name="swap" size={20} className="shrink-0 text-[var(--type-swap)]" />

        <div className="min-w-0 flex-1">
          <span className="block text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--ink-muted)]">
            {t.swapOffer.against}
          </span>
          <Link
            href={`/${locale}/listings/${offer.listing_slug}`}
            className="mt-1 block truncate text-[0.875rem] font-bold text-[var(--ink)] hover:text-[var(--brand-700)]"
          >
            {offer.listing_title}
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[0.75rem] text-[var(--ink-muted)]">
          <Avatar src={offer.sender_avatar} name={offer.sender_name} size={18} />
          {offer.sender_name}
        </span>

        {offer.status === "pending" ? (
          offer.is_mine ? (
            <Button
              size="sm"
              variant="ghost"
              className="ms-auto"
              disabled={pending}
              onClick={() => run("withdraw")}
            >
              {t.swapOffer.withdraw}
            </Button>
          ) : (
            <div className="ms-auto flex gap-2">
              <Button size="sm" disabled={pending} onClick={() => run("accept")}>
                {t.deal.accept}
              </Button>
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => run("decline")}>
                {t.deal.decline}
              </Button>
            </div>
          )
        ) : null}
      </div>
    </li>
  );
}
