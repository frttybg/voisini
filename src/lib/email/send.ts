/**
 * Resend üzerinden e-posta gönderimi — ham REST, ek paket yok.
 *
 * RESEND_API_KEY tanımlı değilse gönderim sessizce kapalıdır; site
 * bildirim e-postası olmadan sorunsuz çalışmaya devam eder.
 */

const ENDPOINT = "https://api.resend.com/emails";

export const emailEnabled = Boolean(process.env.RESEND_API_KEY);

/** Gönderen adresi. Alan adı Resend'de doğrulanmış olmalı. */
function from(): string {
  return process.env.EMAIL_FROM || "Voisini <noreply@voisini.com>";
}

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Aynı olayın iki kez gönderilmesini önlemek için (Resend başlığı). */
  idempotencyKey?: string;
};

/**
 * Gönderir; başarısız olursa hata fırlatmaz, yalnızca sunucu günlüğüne
 * yazar. Bildirim e-postası yüzünden bir işlem başarısız olmamalı.
 */
export async function sendEmail(mail: OutgoingEmail): Promise<boolean> {
  if (!emailEnabled) return false;

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    };
    if (mail.idempotencyKey) headers["Idempotency-Key"] = mail.idempotencyKey;

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      cache: "no-store",
      body: JSON.stringify({
        from: from(),
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    });

    if (!res.ok) {
      console.error("[email] gönderilemedi", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] gönderim hatası", error);
    return false;
  }
}
