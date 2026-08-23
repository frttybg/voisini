"use server";

import { revalidatePath } from "next/cache";
import { publicEnv } from "@/lib/env";
import { serviceClient, userClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/session";
import { getUser } from "@/lib/supabase/auth";
import { getPaymentProvider, paymentsEnabled, platformFeeCents } from "@/lib/payments";
import { fail, rateLimit, succeed, type ActionState } from "./shared";

function siteUrl() {
  return publicEnv.siteUrl.replace(/\/$/, "");
}

type TxRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  listing_id: string;
};

/**
 * Alıcı için Stripe Checkout oturumu açar ve ödeme sayfasının
 * adresini döndürür. Tutar HER ZAMAN veritabanından okunur —
 * istemciden gelen hiçbir tutara güvenilmez.
 */
export async function startCheckoutAction(
  transactionId: string,
  locale: string,
): Promise<ActionState> {
  if (!paymentsEnabled) return fail("paymentsDisabled");

  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");
  if (!(await rateLimit("checkout", 20, 3600, userId))) return fail("rateLimited");

  const { data: tx } = await client
    .from<TxRow>("transactions")
    .select("id,buyer_id,seller_id,amount_cents,currency,status,listing_id")
    .eq("id", transactionId)
    .maybeSingle();

  if (!tx) return fail("notFound");
  if (tx.buyer_id !== userId) return fail("forbidden");
  if (!["requested", "accepted", "in_progress"].includes(tx.status)) return fail("invalidState");

  const { data: listing } = await client
    .from<{ title: string }>("listings")
    .select("title")
    .eq("id", tx.listing_id)
    .maybeSingle();

  const { data: deposit } = await client
    .from<{ id: string; amount_cents: number; status: string }>("deposits")
    .select("id,amount_cents,status")
    .eq("transaction_id", transactionId)
    .maybeSingle();

  const depositCents =
    deposit && ["pending", "authorized"].includes(deposit.status) ? deposit.amount_cents : 0;

  if (tx.amount_cents + depositCents <= 0) return fail("nothingToPay");

  const { data: seller } = await client
    .from<{ stripe_account_id: string | null; payouts_enabled: boolean }>("profiles")
    .select("stripe_account_id,payouts_enabled")
    .eq("id", tx.seller_id)
    .maybeSingle();

  if (!seller?.payouts_enabled || !seller.stripe_account_id) {
    return fail("sellerNotReady");
  }

  // Alıcının e-postası (Checkout formunu önden doldurur)
  let buyerEmail: string | null = null;
  const session = await getSession();
  if (session) {
    const { data: authUser } = await getUser(session.accessToken);
    buyerEmail = authUser?.email ?? null;
  }

  const provider = getPaymentProvider();
  const fee = platformFeeCents(tx.amount_cents);

  try {
    const checkout = await provider.createCheckout({
      transactionId: tx.id,
      amountCents: tx.amount_cents,
      depositCents,
      currency: tx.currency || "EUR",
      description: listing?.title ?? "Voisini",
      sellerAccountId: seller.stripe_account_id,
      applicationFeeCents: fee,
      successUrl: `${siteUrl()}/${locale}/deals?payment=success`,
      cancelUrl: `${siteUrl()}/${locale}/deals?payment=cancelled`,
      buyerEmail,
    });

    // Ödeme kaydını şimdi aç; webhook tamamlandığında güncelleyecek.
    const admin = serviceClient();
    await admin.from("payments").upsert(
      {
        transaction_id: tx.id,
        provider: provider.id,
        provider_intent_id: checkout.sessionId,
        status: "pending",
        amount_cents: tx.amount_cents + depositCents,
        fee_cents: fee,
        currency: tx.currency || "EUR",
        metadata: { deposit_cents: depositCents, checkout_session: checkout.sessionId },
      },
      { onConflict: "provider,provider_intent_id" },
    );

    return succeed(undefined, { data: { url: checkout.url } });
  } catch (error) {
    return fail((error as Error).message);
  }
}

/* ------------------------------------------------- Satıcı ödeme hesabı */

export async function startConnectOnboardingAction(locale: string): Promise<ActionState> {
  if (!paymentsEnabled) return fail("paymentsDisabled");

  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");

  const { data: profile } = await client
    .from<{ stripe_account_id: string | null; country: string | null }>("profiles")
    .select("stripe_account_id,country")
    .eq("id", userId)
    .maybeSingle();

  const session = await getSession();
  if (!session) return fail("forbidden");
  const { data: authUser } = await getUser(session.accessToken);
  const email = authUser?.email;
  if (!email) return fail("error");

  const provider = getPaymentProvider();
  const admin = serviceClient();

  try {
    let accountId = profile?.stripe_account_id ?? null;

    if (!accountId) {
      const account = await provider.createConnectAccount({
        email,
        country: profile?.country || "FR",
      });
      accountId = account.id;
      await admin.from("profiles").update({ stripe_account_id: accountId }).eq("id", userId);
    }

    const link = await provider.createAccountLink({
      accountId,
      refreshUrl: `${siteUrl()}/${locale}/profile?payouts=refresh`,
      returnUrl: `${siteUrl()}/${locale}/profile?payouts=return`,
    });

    return succeed(undefined, { data: { url: link.url } });
  } catch (error) {
    return fail((error as Error).message);
  }
}

/** Stripe'tan güncel hesap durumunu çekip profile yazar. */
export async function refreshPayoutStatusAction(): Promise<ActionState> {
  if (!paymentsEnabled) return fail("paymentsDisabled");

  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");

  const { data: profile } = await client
    .from<{ stripe_account_id: string | null }>("profiles")
    .select("stripe_account_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.stripe_account_id) return fail("notFound");

  try {
    const account = await getPaymentProvider().getAccount(profile.stripe_account_id);
    await serviceClient()
      .from("profiles")
      .update({
        payouts_enabled: account.payoutsEnabled,
        payouts_requirements: account.requirements,
      })
      .eq("id", userId);

    revalidatePath("/", "layout");
    return succeed("saved", { data: { payoutsEnabled: account.payoutsEnabled } });
  } catch (error) {
    return fail((error as Error).message);
  }
}

/** Satıcının Stripe panelini açar (kazançlar, ödeme günleri). */
export async function openPayoutDashboardAction(): Promise<ActionState> {
  if (!paymentsEnabled) return fail("paymentsDisabled");
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");

  const { data: profile } = await client
    .from<{ stripe_account_id: string | null; payouts_enabled: boolean }>("profiles")
    .select("stripe_account_id,payouts_enabled")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.stripe_account_id || !profile.payouts_enabled) return fail("notFound");

  try {
    const link = await getPaymentProvider().createLoginLink(profile.stripe_account_id);
    return succeed(undefined, { data: { url: link.url } });
  } catch (error) {
    return fail((error as Error).message);
  }
}

/**
 * İşlem tamamlandığında depozitoyu alıcıya iade eder.
 * completeDealAction tarafından otomatik çağrılır.
 */
export async function releaseDepositForTransaction(transactionId: string): Promise<void> {
  if (!paymentsEnabled) return;

  const admin = serviceClient();

  const { data: deposit } = await admin
    .from<{ id: string; amount_cents: number; released_cents: number; status: string }>("deposits")
    .select("id,amount_cents,released_cents,status")
    .eq("transaction_id", transactionId)
    .maybeSingle();

  if (!deposit || deposit.status === "released") return;
  const remaining = deposit.amount_cents - deposit.released_cents;
  if (remaining <= 0) return;

  const { data: payment } = await admin
    .from<{ id: string; provider_intent_id: string | null; status: string }>("payments")
    .select("id,provider_intent_id,status")
    .eq("transaction_id", transactionId)
    .eq("status", "captured")
    .maybeSingle();

  if (!payment?.provider_intent_id || !payment.provider_intent_id.startsWith("pi_")) return;

  try {
    await getPaymentProvider().refund({
      paymentIntentId: payment.provider_intent_id,
      amountCents: remaining,
      reason: "requested_by_customer",
    });

    await admin
      .from("deposits")
      .update({
        status: "released",
        released_cents: deposit.amount_cents,
        released_at: new Date().toISOString(),
      })
      .eq("id", deposit.id);
  } catch {
    // İade başarısız olursa depozito "captured" kalır ve admin panelinden
    // manuel olarak ele alınabilir — sessizce kaybolmaz.
  }
}
