import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { serviceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook'u.
 *
 * - İmza doğrulanmadan HİÇBİR veri işlenmez.
 * - Her olay id'si `payment_events` tablosuna yazılır; aynı olay iki kez
 *   gelirse (Stripe tekrar dener) ikinci seferde hiçbir şey yapılmaz.
 * - Doğrulama başarısız olsa bile 400 döner; Stripe bunu yeniden dener.
 */
export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  const provider = getPaymentProvider();
  const verified = await provider.verifyWebhook(payload, signature);

  if (!verified.ok) {
    return NextResponse.json({ error: verified.reason }, { status: 400 });
  }

  const event = verified.event;
  let admin: ReturnType<typeof serviceClient>;
  try {
    admin = serviceClient();
  } catch {
    return NextResponse.json({ error: "service_key_missing" }, { status: 500 });
  }

  // --- Tekrar koruması --------------------------------------------------
  const { error: dupError } = await admin.from("payment_events").insert({
    id: event.id,
    type: event.type,
    payload: { type: event.type },
  });
  if (dupError) {
    // 23505 = zaten işlenmiş
    if (dupError.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }

  const object = event.data.object as Record<string, unknown>;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const sessionId = String(object.id ?? "");
        const paymentIntentId = String(object.payment_intent ?? "");
        const transactionId = String(
          (object.metadata as Record<string, string> | undefined)?.transaction_id ??
            object.client_reference_id ??
            "",
        );
        const paid = object.payment_status === "paid";
        if (!transactionId) break;

        await admin
          .from("payments")
          .update({
            status: paid ? "captured" : "authorized",
            provider_intent_id: paymentIntentId || sessionId,
            metadata: { checkout_session: sessionId },
          })
          .eq("provider_intent_id", sessionId);

        await admin
          .from("deposits")
          .update({ status: "captured" })
          .eq("transaction_id", transactionId)
          .eq("status", "pending");

        if (paid) {
          await admin.rpc("mark_transaction_paid", { p_transaction_id: transactionId });
        }
        break;
      }

      case "checkout.session.expired": {
        await admin
          .from("payments")
          .update({ status: "cancelled" })
          .eq("provider_intent_id", String(object.id ?? ""))
          .eq("status", "pending");
        break;
      }

      case "payment_intent.payment_failed": {
        const message =
          ((object.last_payment_error as Record<string, unknown> | undefined)?.message as string) ??
          null;
        await admin
          .from("payments")
          .update({ status: "failed", error_message: message })
          .eq("provider_intent_id", String(object.id ?? ""));
        break;
      }

      case "charge.refunded": {
        const paymentIntentId = String(object.payment_intent ?? "");
        const amountRefunded = Number(object.amount_refunded ?? 0);
        const amount = Number(object.amount ?? 0);

        const { data: payment } = await admin
          .from<{ transaction_id: string; amount_cents: number }>("payments")
          .select("transaction_id,amount_cents")
          .eq("provider_intent_id", paymentIntentId)
          .maybeSingle();

        if (payment) {
          await admin
            .from("payments")
            .update({
              status: amountRefunded >= amount ? "refunded" : "partially_refunded",
            })
            .eq("provider_intent_id", paymentIntentId);

          await admin
            .from("deposits")
            .update({
              status: "released",
              released_at: new Date().toISOString(),
            })
            .eq("transaction_id", payment.transaction_id)
            .in("status", ["pending", "authorized", "captured"]);
        }
        break;
      }

      case "account.updated": {
        const accountId = String(object.id ?? "");
        const payoutsEnabled = Boolean(object.payouts_enabled) && Boolean(object.charges_enabled);
        await admin
          .from("profiles")
          .update({
            payouts_enabled: payoutsEnabled,
            payouts_requirements: (object.requirements as Record<string, unknown>) ?? {},
          })
          .eq("stripe_account_id", accountId);
        break;
      }

      default:
        break;
    }
  } catch {
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
