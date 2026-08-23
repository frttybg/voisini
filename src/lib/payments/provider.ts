/**
 * Sağlayıcıdan bağımsız ödeme arayüzü.
 *
 * Uygulamanın geri kalanı yalnızca bu arayüzü tanır. Stripe'ı bir gün
 * Mollie, Adyen veya başka bir sağlayıcıyla değiştirmek istersen tek
 * yapman gereken bu arayüzü uygulayan yeni bir dosya yazmak.
 */

export type CheckoutParams = {
  transactionId: string;
  /** Satıcıya gidecek tutar (kuruş) */
  amountCents: number;
  /** Platformda tutulacak, işlem sonunda iade edilecek depozito (kuruş) */
  depositCents: number;
  currency: string;
  description: string;
  /** Satıcının bağlı hesabı; yoksa doğrudan tahsilat yapılmaz */
  sellerAccountId: string | null;
  /** Platform komisyonu (kuruş) */
  applicationFeeCents: number;
  successUrl: string;
  cancelUrl: string;
  buyerEmail?: string | null;
};

export type CheckoutResult = { url: string; sessionId: string };

export type RefundParams = {
  paymentIntentId: string;
  amountCents?: number;
  reason?: "requested_by_customer" | "duplicate" | "fraudulent";
};

export type ConnectAccount = {
  id: string;
  payoutsEnabled: boolean;
  requirements: Record<string, unknown>;
};

export type WebhookEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

export type WebhookResult =
  | { ok: true; event: WebhookEvent }
  | { ok: false; reason: string };

export interface PaymentProvider {
  readonly id: string;
  readonly enabled: boolean;

  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  refund(params: RefundParams): Promise<{ id: string }>;

  createConnectAccount(params: { email: string; country: string }): Promise<{ id: string }>;
  createAccountLink(params: {
    accountId: string;
    refreshUrl: string;
    returnUrl: string;
  }): Promise<{ url: string }>;
  getAccount(accountId: string): Promise<ConnectAccount>;
  createLoginLink(accountId: string): Promise<{ url: string }>;

  verifyWebhook(payload: string, signatureHeader: string | null): Promise<WebhookResult>;
}

export class PaymentError extends Error {
  code?: string;
  status: number;
  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.name = "PaymentError";
    this.status = status;
    this.code = code;
  }
}

/** Anahtar yokken kullanılan güvenli varsayılan: ödeme kapalıdır. */
export const disabledProvider: PaymentProvider = {
  id: "disabled",
  enabled: false,
  async createCheckout() {
    throw new PaymentError("payments_disabled", 503);
  },
  async refund() {
    throw new PaymentError("payments_disabled", 503);
  },
  async createConnectAccount() {
    throw new PaymentError("payments_disabled", 503);
  },
  async createAccountLink() {
    throw new PaymentError("payments_disabled", 503);
  },
  async getAccount() {
    throw new PaymentError("payments_disabled", 503);
  },
  async createLoginLink() {
    throw new PaymentError("payments_disabled", 503);
  },
  async verifyWebhook() {
    return { ok: false as const, reason: "payments_disabled" };
  },
};
