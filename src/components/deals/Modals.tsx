"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { Modal, useToast } from "@/components/ui/Overlay";
import {
  createSwapOfferAction,
  requestDealAction,
  submitRatingAction,
} from "@/lib/actions/transactions";
import { openDisputeAction } from "@/lib/actions/transactions";
import { idleState } from "@/lib/actions/state";
import { useActionSuccess } from "@/lib/useActionSuccess";
import type { ListingType } from "@/lib/supabase/types";

/* ------------------------------------------------------- Talep modalı */

export function DealRequestModal({
  open,
  onClose,
  listingId,
  type,
}: {
  open: boolean;
  onClose: () => void;
  listingId: string;
  type: ListingType;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction, pending] = useActionState(requestDealAction, idleState);

  useActionSuccess(state, () => {
    toast(t.deal.requestSent, "success");
    onClose();
    router.push(`/${locale}/deals`);
  });

  const needsDates = type === "rent" || type === "lend";

  return (
    <Modal open={open} onClose={onClose} title={t.deal.request}>
      {state.message && !state.ok ? (
        <p className="mb-4 rounded-[var(--radius-md)] bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] px-3.5 py-3 text-[0.8125rem] text-[var(--danger)]">
          {state.message === "rateLimited" ? t.errors.rateLimited : t.common.error}
        </p>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="listingId" value={listingId} />

        {needsDates ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="startsAt">{t.listing.lendFrom}</Label>
              <Input id="startsAt" name="startsAt" type="date" required />
            </div>
            <div>
              <Label htmlFor="endsAt">{t.listing.lendTo}</Label>
              <Input id="endsAt" name="endsAt" type="date" required />
            </div>
          </div>
        ) : null}

        {type === "rent" ? (
          <div>
            <Label htmlFor="units">{t.deal.units}</Label>
            <Input id="units" name="units" type="number" min={1} defaultValue={1} />
          </div>
        ) : null}

        <div>
          <Label htmlFor="note">{t.deal.note}</Label>
          <Textarea
            id="note"
            name="note"
            rows={3}
            maxLength={1000}
            placeholder={t.deal.notePlaceholder}
          />
        </div>

        <Button type="submit" size="lg" full loading={pending}>
          {t.deal.request}
        </Button>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------- Takas teklifi modalı */

export function SwapOfferModal({
  open,
  onClose,
  listingId,
  myListings,
}: {
  open: boolean;
  onClose: () => void;
  listingId: string;
  myListings: { id: string; title: string }[];
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction, pending] = useActionState(createSwapOfferAction, idleState);

  useActionSuccess(state, () => {
    toast(t.swapOffer.sent, "success");
    onClose();
    router.push(`/${locale}/deals`);
  });

  return (
    <Modal open={open} onClose={onClose} title={t.swapOffer.title}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="listingId" value={listingId} />

        <div>
          <Label htmlFor="offeredListingId">{t.swapOffer.chooseListing}</Label>
          {myListings.length ? (
            <Select id="offeredListingId" name="offeredListingId" defaultValue="">
              <option value="">—</option>
              {myListings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </Select>
          ) : (
            <p className="rounded-[var(--radius-md)] bg-[var(--surface-sunken)] px-3.5 py-3 text-[0.8125rem] text-[var(--ink-muted)]">
              {t.swapOffer.noListings}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="offeredText">{t.swapOffer.orDescribe}</Label>
          <Textarea
            id="offeredText"
            name="offeredText"
            rows={3}
            maxLength={500}
            placeholder={t.swapOffer.describePlaceholder}
          />
          {state.errors?.offeredText ? (
            <p className="mt-1.5 text-[0.8125rem] text-[var(--danger)]">{t.common.required}</p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="cashAdjust" hint={t.common.optional}>
            {t.swapOffer.cashAdjust} (€)
          </Label>
          <Input id="cashAdjust" name="cashAdjust" type="number" step="0.01" icon="euro" />
        </div>

        <Button type="submit" size="lg" full loading={pending}>
          {t.swapOffer.send}
        </Button>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------- Puanlama modalı */

export function RatingModal({
  open,
  onClose,
  transactionId,
  counterpartName,
}: {
  open: boolean;
  onClose: () => void;
  transactionId: string;
  counterpartName: string;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [score, setScore] = useState(5);
  const [state, formAction, pending] = useActionState(submitRatingAction, idleState);

  useActionSuccess(state, () => {
    toast(t.rating.thanks, "success");
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} title={t.rating.title}>
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="transactionId" value={transactionId} />
        <input type="hidden" name="score" value={score} />

        <p className="text-sm text-[var(--ink-muted)]">{counterpartName}</p>

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setScore(value)}
              aria-label={`${value}`}
              className={cn(
                "rounded-full p-1.5 transition-transform duration-200 active:scale-90",
                value <= score ? "text-[var(--warning)]" : "text-[var(--line)]",
              )}
            >
              <Icon
                name="star"
                size={32}
                fill={value <= score ? "currentColor" : "none"}
                strokeWidth={value <= score ? 0 : 1.6}
              />
            </button>
          ))}
        </div>

        <div>
          <Label htmlFor="comment">{t.rating.comment}</Label>
          <Textarea
            id="comment"
            name="comment"
            rows={4}
            maxLength={1000}
            placeholder={t.rating.commentPlaceholder}
          />
        </div>

        <Button type="submit" size="lg" full loading={pending}>
          {t.rating.submit}
        </Button>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------- Sorun bildirme */

export function DisputeModal({
  open,
  onClose,
  transactionId,
}: {
  open: boolean;
  onClose: () => void;
  transactionId: string;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [state, formAction, pending] = useActionState(openDisputeAction, idleState);

  useActionSuccess(state, () => {
    toast(t.dispute.sent, "success");
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} title={t.dispute.title}>
      {state.message && !state.ok ? (
        <p className="mb-4 rounded-[var(--radius-md)] bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] px-3.5 py-3 text-[0.8125rem] text-[var(--danger)]">
          {state.message === "rateLimited" ? t.errors.rateLimited : t.common.error}
        </p>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="transactionId" value={transactionId} />

        <p className="text-sm text-[var(--ink-muted)]">{t.dispute.intro}</p>

        <div>
          <Label htmlFor="reason" required>{t.dispute.reason}</Label>
          <Input
            id="reason"
            name="reason"
            maxLength={200}
            required
            placeholder={t.dispute.reasonPlaceholder}
          />
        </div>

        <div>
          <Label htmlFor="details">{t.dispute.details}</Label>
          <Textarea
            id="details"
            name="details"
            rows={5}
            maxLength={2000}
            placeholder={t.dispute.detailsPlaceholder}
          />
        </div>

        <Button type="submit" size="lg" full loading={pending}>
          {t.dispute.send}
        </Button>
      </form>
    </Modal>
  );
}
