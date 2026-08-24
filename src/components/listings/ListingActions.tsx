"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal, useToast } from "@/components/ui/Overlay";
import { Label, Select, Textarea } from "@/components/ui/Field";
import { DealRequestModal, SwapOfferModal } from "@/components/deals/Modals";
import { startConversationAction } from "@/lib/actions/messages";
import { reportListingAction } from "@/lib/actions/listings";
import { idleState } from "@/lib/actions/state";
import type { ListingType } from "@/lib/supabase/types";

export function ListingActions({
  listingId,
  type,
  isOwner,
  authenticated,
  available,
  myListings,
}: {
  listingId: string;
  type: ListingType;
  isOwner: boolean;
  authenticated: boolean;
  available: boolean;
  myListings: { id: string; title: string }[];
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [dealOpen, setDealOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportState, reportAction, reportPending] = useActionState(
    reportListingAction,
    idleState,
  );

  const primaryLabel =
    type === "sell"
      ? t.listing.buyNow
      : type === "rent"
        ? t.listing.rentNow
        : type === "swap"
          ? t.listing.makeOffer
          : type === "lend"
            ? t.listing.requestLoan
            : t.deal.request;

  function requireAuth(next: () => void) {
    if (!authenticated) {
      router.push(`/${locale}/login?next=/${locale}/listings`);
      return;
    }
    next();
  }

  function contact() {
    requireAuth(() =>
      startTransition(async () => {
        const result = await startConversationAction(listingId);
        if (!result.ok) {
          toast(t.common.error, "error");
          return;
        }
        router.push(`/${locale}/messages/${String(result.data?.conversationId ?? "")}`);
      }),
    );
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        /* kullanıcı vazgeçti */
      }
    }
    await navigator.clipboard.writeText(url);
    toast(t.common.saved, "success");
  }

  if (isOwner) {
    return (
      <div className="flex flex-col gap-2">
        <Button href={`/${locale}/deals`} variant="outline" full icon="swap">
          {t.deal.title}
        </Button>
        <Button href={`/${locale}/profile`} variant="ghost" full icon="settings">
          {t.nav.myListings}
        </Button>
        <Button variant="ghost" full icon="share" onClick={share}>
          {t.listing.share}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        full
        icon={type === "swap" ? "swap" : "check"}
        disabled={!available}
        onClick={() =>
          requireAuth(() => (type === "swap" ? setSwapOpen(true) : setDealOpen(true)))
        }
        magnetic
      >
        {primaryLabel}
      </Button>

      <Button variant="outline" full icon="message" loading={pending} onClick={contact}>
        {t.listing.contactSeller}
      </Button>

      <div className="flex gap-2">
        <Button variant="ghost" full icon="share" onClick={share}>
          {t.listing.share}
        </Button>
        <Button variant="ghost" icon="flag" onClick={() => requireAuth(() => setReportOpen(true))}>
          <span className="sr-only sm:not-sr-only">{t.listing.reportListing}</span>
        </Button>
      </div>

      <DealRequestModal
        open={dealOpen}
        onClose={() => setDealOpen(false)}
        listingId={listingId}
        type={type}
      />
      <SwapOfferModal
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        listingId={listingId}
        myListings={myListings}
      />

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={t.listing.reportListing}>
        {reportState.ok ? (
          <p className="flex items-center gap-2 text-sm text-[var(--success)]">
            <Icon name="check" size={16} />
            {t.report.sent}
          </p>
        ) : (
          <form action={reportAction} className="flex flex-col gap-4">
            <input type="hidden" name="listingId" value={listingId} />
            <div>
              <Label htmlFor="reason" required>
                {t.report.reason}
              </Label>
              <Select id="reason" name="reason" required>
                <option value="spam">{t.report.spam}</option>
                <option value="scam">{t.report.scam}</option>
                <option value="illegal">{t.report.illegal}</option>
                <option value="offensive">{t.report.offensive}</option>
                <option value="wrong_category">{t.report.wrongCategory}</option>
                <option value="other">{t.report.other}</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="details">{t.report.details}</Label>
              <Textarea
                id="details"
                name="details"
                rows={4}
                maxLength={1000}
                placeholder={t.report.detailsPlaceholder}
              />
            </div>
            <Button type="submit" full loading={reportPending}>
              {t.common.confirm}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
