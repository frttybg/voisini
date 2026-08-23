import { createHmac, timingSafeEqual } from "node:crypto";
import {
  PaymentError,
  type CheckoutParams,
  type CheckoutResult,
  type ConnectAccount,
  type PaymentProvider,
  type RefundParams,
  type WebhookResult,
} from "./provider";

/**
 * Stripe entegrasyonu — resmî npm paketi olmadan, doğrudan REST API ile.
 *
 * Kart bilgileri hiçbir zaman bu sunucuya uğramaz: kullanıcı Stripe'ın
 * barındırdığı Checkout sayfasına yönlendirilir (PCI yükü Stripe'ta kalır).
 *
 * Para akışı (destination charge):
 *   Alıcı  →  Stripe  →  satıcının bağlı hesabı (kira/satış tutarı)
 *                     →  platform (komisyon + depozito)
 * Depozito platformda bekler; işlem tamamlanınca alıcıya iade edilir.
 */

const API = "https://api.stripe.com/v1";
const API_VERSION = "2024-06-20";

function form(data: Record<string, unknown>, parentKey = ""): string[] {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    const composed = parentKey ? `${parentKey}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item !== null && typeof item === "object") {
          parts.push(...form(item as Record<string, unknown>, `${composed}[${index}]`));
        } else {
          parts.push(`${encodeURIComponent(`${composed}[${index}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else if (typeof value === "object") {
      parts.push(...form(value as Record<string, unknown>, composed));
    } else {
      parts.push(`${encodeURIComponent(composed)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts;
}

export function createStripeProvider(config: {
  secretKey: string;
  webhookSecret: string;
}): PaymentProvider {
  async function call<T>(
    path: string,
    body?: Record<string, unknown>,
    options: { method?: string; idempotencyKey?: string } = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.secretKey}`,
      "Stripe-Version": API_VERSION,
    };
    if (body) headers["Content-Type"] = "application/x-www-form-urlencoded";
    if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

    let res: Response;
    try {
      res = await fetch(`${API}${path}`, {
        method: options.method ?? (body ? "POST" : "GET"),
        headers,
        body: body ? form(body).join("&") : undefined,
        cache: "no-store",
      });
    } catch (e) {
      throw new PaymentError((e as Error).message, 0);
    }

    const text = await res.text();
    const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};

    if (!res.ok) {
      const err = (payload.error ?? {}) as Record<string, unknown>;
      throw new PaymentError(
        (err.message as string) ?? `Stripe hatası (${res.status})`,
        res.status,
        err.code as string | undefined,
      );
    }
    return payload as T;
  }

  return {
    id: "stripe",
    enabled: true,

    async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
      if (params.amountCents + params.depositCents <= 0) {
        throw new PaymentError("nothing_to_pay", 400);
      }

      const lineItems: Record<string, unknown>[] = [];
      if (params.amountCents > 0) {
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: params.currency.toLowerCase(),
            unit_amount: params.amountCents,
            product_data: { name: params.description.slice(0, 120) },
          },
        });
      }
      if (params.depositCents > 0) {
        lineItems.push({
          quantity: 1,
          price_data: {
            currency: params.currency.toLowerCase(),
            unit_amount: params.depositCents,
            product_data: { name: `Caution — ${params.description.slice(0, 100)}` },
          },
        });
      }

      const paymentIntentData: Record<string, unknown> = {
        metadata: {
          transaction_id: params.transactionId,
          deposit_cents: String(params.depositCents),
        },
      };

      // Satıcının payına düşen kısım doğrudan onun hesabına aktarılır.
      // Depozito ve komisyon platformda kalır.
      if (params.sellerAccountId && params.amountCents > 0) {
        const sellerShare = Math.max(params.amountCents - params.applicationFeeCents, 0);
        if (sellerShare > 0) {
          paymentIntentData.transfer_data = {
            destination: params.sellerAccountId,
            amount: sellerShare,
          };
        }
      }

      const session = await call<{ id: string; url: string }>(
        "/checkout/sessions",
        {
          mode: "payment",
          line_items: lineItems,
          success_url: params.successUrl,
          cancel_url: params.cancelUrl,
          client_reference_id: params.transactionId,
          customer_email: params.buyerEmail ?? undefined,
          payment_intent_data: paymentIntentData,
          metadata: {
            transaction_id: params.transactionId,
            deposit_cents: String(params.depositCents),
          },
          automatic_tax: { enabled: false },
        },
        { idempotencyKey: `checkout_${params.transactionId}_${params.amountCents}_${params.depositCents}` },
      );

      if (!session.url) throw new PaymentError("no_checkout_url", 502);
      return { url: session.url, sessionId: session.id };
    },

    async refund(params: RefundParams) {
      const refund = await call<{ id: string }>("/refunds", {
        payment_intent: params.paymentIntentId,
        amount: params.amountCents,
        reason: params.reason,
      });
      return { id: refund.id };
    },

    async createConnectAccount({ email, country }) {
      const account = await call<{ id: string }>("/accounts", {
        type: "express",
        country: country || "FR",
        email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        business_type: "individual",
        settings: { payouts: { schedule: { interval: "daily" } } },
      });
      return { id: account.id };
    },

    async createAccountLink({ accountId, refreshUrl, returnUrl }) {
      const link = await call<{ url: string }>("/account_links", {
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding",
      });
      return { url: link.url };
    },

    async getAccount(accountId: string): Promise<ConnectAccount> {
      const account = await call<{
        id: string;
        payouts_enabled: boolean;
        charges_enabled: boolean;
        requirements: Record<string, unknown>;
      }>(`/accounts/${accountId}`);
      return {
        id: account.id,
        payoutsEnabled: Boolean(account.payouts_enabled && account.charges_enabled),
        requirements: account.requirements ?? {},
      };
    },

    async createLoginLink(accountId: string) {
      const link = await call<{ url: string }>(`/accounts/${accountId}/login_links`, {});
      return { url: link.url };
    },

    async verifyWebhook(payload: string, signatureHeader: string | null): Promise<WebhookResult> {
      if (!signatureHeader) return { ok: false, reason: "missing_signature" };
      if (!config.webhookSecret) return { ok: false, reason: "missing_secret" };

      const parts = Object.fromEntries(
        signatureHeader.split(",").map((piece) => {
          const [k, ...rest] = piece.trim().split("=");
          return [k, rest.join("=")];
        }),
      );

      const timestamp = parts.t;
      const signature = parts.v1;
      if (!timestamp || !signature) return { ok: false, reason: "malformed_signature" };

      // 5 dakikadan eski imzalar reddedilir (replay koruması)
      const age = Math.abs(Date.now() / 1000 - Number(timestamp));
      if (!Number.isFinite(age) || age > 300) return { ok: false, reason: "signature_expired" };

      const expected = createHmac("sha256", config.webhookSecret)
        .update(`${timestamp}.${payload}`, "utf8")
        .digest("hex");

      const a = Buffer.from(expected, "utf8");
      const b = Buffer.from(signature, "utf8");
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return { ok: false, reason: "signature_mismatch" };
      }

      try {
        const event = JSON.parse(payload) as {
          id: string;
          type: string;
          data: { object: Record<string, unknown> };
        };
        return { ok: true, event };
      } catch {
        return { ok: false, reason: "invalid_json" };
      }
    },
  };
}
