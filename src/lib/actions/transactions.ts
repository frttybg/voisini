"use server";

import { revalidatePath } from "next/cache";
import { userClient } from "@/lib/supabase/server";
import { stripHtml } from "@/lib/validation";
import type { DealRow, RatingRow, SwapOfferRow } from "@/lib/supabase/types";
import { releaseDepositForTransaction } from "./payments";
import { fail, rateLimit, succeed, type ActionState } from "./shared";
import { after } from "next/server";
import { mailDealAnswered, mailDealRequested } from "@/lib/email/notify";

/* ------------------------------------------------------------- Talepler */

export async function requestDealAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");
  if (!(await rateLimit("deal_request", 20, 3600, userId))) return fail("rateLimited");

  const listingId = String(formData.get("listingId") ?? "");
  if (!listingId) return fail("error");

  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "");
  const units = Number(formData.get("units") ?? 1);
  const note = stripHtml(String(formData.get("note") ?? "")).slice(0, 1000);

  const { data, error } = await client.rpc<string>("request_transaction", {
    p_listing_id: listingId,
    p_starts_at: startsAt || null,
    p_ends_at: endsAt || null,
    p_units: Number.isFinite(units) && units > 0 ? Math.round(units) : 1,
    p_note: note || null,
  });

  if (error) return fail(error.message);

  if (data) after(() => mailDealRequested(data));

  revalidatePath("/", "layout");
  return succeed("requestSent", { data: { transactionId: data } });
}

export async function respondDealAction(
  transactionId: string,
  accept: boolean,
): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");

  const { error } = await client.rpc("respond_transaction", {
    p_transaction_id: transactionId,
    p_accept: accept,
  });
  if (error) return fail(error.message);

  after(() => mailDealAnswered(transactionId, accept));

  revalidatePath("/", "layout");
  return succeed("saved");
}

export async function completeDealAction(transactionId: string): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");

  const { data, error } = await client.rpc<string>("complete_transaction", {
    p_transaction_id: transactionId,
  });
  if (error) return fail(error.message);

  // İşlem kapandıysa depozito otomatik olarak alıcıya iade edilir.
  if (data === "completed") {
    await releaseDepositForTransaction(transactionId);
  }

  revalidatePath("/", "layout");
  return succeed("saved", { data: { status: data } });
}

export async function cancelDealAction(
  transactionId: string,
  reason?: string,
): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");

  const { error } = await client.rpc("cancel_transaction", {
    p_transaction_id: transactionId,
    p_reason: reason ? stripHtml(reason).slice(0, 300) : null,
  });
  if (error) return fail(error.message);

  revalidatePath("/", "layout");
  return succeed("saved");
}

/* -------------------------------------------------------- Takas teklifi */

export async function createSwapOfferAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");
  if (!(await rateLimit("swap_offer", 20, 3600, userId))) return fail("rateLimited");

  const listingId = String(formData.get("listingId") ?? "");
  const offeredListingId = String(formData.get("offeredListingId") ?? "");
  const offeredText = stripHtml(String(formData.get("offeredText") ?? "")).slice(0, 500);
  const cash = Number(String(formData.get("cashAdjust") ?? "0").replace(",", "."));

  if (!listingId) return fail("error");
  if (!offeredListingId && !offeredText) {
    return { ok: false, errors: { offeredText: "required" } };
  }

  const { data, error } = await client.rpc<string>("create_swap_offer", {
    p_listing_id: listingId,
    p_offered_listing_id: offeredListingId || null,
    p_offered_text: offeredText || null,
    p_cash_adjust_cents: Number.isFinite(cash) ? Math.round(cash * 100) : 0,
    p_parent_offer_id: null,
  });

  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return succeed("sent", { data: { offerId: data } });
}

export async function respondSwapOfferAction(
  exchangeId: string,
  action: "accept" | "decline" | "withdraw",
): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");

  const { data, error } = await client.rpc<string | null>("respond_swap_offer", {
    p_exchange_id: exchangeId,
    p_action: action,
  });
  if (error) return fail(error.message);

  revalidatePath("/", "layout");
  return succeed("saved", { data: { transactionId: data } });
}

/* ------------------------------------------------------------ Puanlama */

export async function submitRatingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");

  const transactionId = String(formData.get("transactionId") ?? "");
  const score = Number(formData.get("score") ?? 0);
  const comment = stripHtml(String(formData.get("comment") ?? "")).slice(0, 1000);

  if (!transactionId) return fail("error");
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return { ok: false, errors: { score: "required" } };
  }

  const { error } = await client.rpc("submit_rating", {
    p_transaction_id: transactionId,
    p_score: score,
    p_comment: comment || null,
  });
  if (error) return fail(error.message);

  revalidatePath("/", "layout");
  return succeed("thanks");
}

/* ------------------------------------------------------------- Okumalar */

export async function fetchDeals(): Promise<DealRow[]> {
  const { client, userId } = await userClient();
  if (!userId) return [];
  const { data } = await client.rpc<DealRow[]>("my_transactions", { p_limit: 60 });
  return data ?? [];
}

export async function fetchSwapOffers(): Promise<SwapOfferRow[]> {
  const { client, userId } = await userClient();
  if (!userId) return [];
  const { data } = await client.rpc<SwapOfferRow[]>("my_swap_offers", { p_limit: 60 });
  return data ?? [];
}

export async function fetchUserRatings(targetUserId: string): Promise<RatingRow[]> {
  const { client } = await userClient();
  const { data } = await client.rpc<RatingRow[]>("user_ratings", {
    p_user_id: targetUserId,
    p_limit: 20,
  });
  return data ?? [];
}
