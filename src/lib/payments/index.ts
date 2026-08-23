import { disabledProvider, type PaymentProvider } from "./provider";
import { createStripeProvider } from "./stripe";

let cached: PaymentProvider | null = null;

/**
 * Aktif ödeme sağlayıcısını döndürür.
 * Anahtarlar tanımlı değilse ödeme kapalıdır ve uygulama
 * "elden ödeme" moduyla sorunsuz çalışmaya devam eder.
 */
export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;

  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  cached = secretKey
    ? createStripeProvider({ secretKey, webhookSecret })
    : disabledProvider;

  return cached;
}

export const paymentsEnabled = Boolean(process.env.STRIPE_SECRET_KEY);

/** Platform komisyonu (baz puan; 250 = %2,5). Varsayılan: komisyon yok. */
export function platformFeeCents(amountCents: number): number {
  const bps = Number(process.env.PLATFORM_FEE_BPS ?? 0);
  if (!Number.isFinite(bps) || bps <= 0) return 0;
  return Math.min(Math.round((amountCents * bps) / 10000), amountCents);
}

export * from "./provider";
