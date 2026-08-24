import { publicEnv } from "@/lib/env";
import { serviceClient } from "@/lib/supabase/server";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { sendEmail } from "./send";

/* ------------------------------------------------------------- yardımcılar */

type MailTarget = {
  email: string;
  name: string;
  locale: string;
  opted_in: boolean;
  banned: boolean;
};

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function siteUrl(): string {
  return publicEnv.siteUrl.replace(/\/$/, "");
}

/** İlan başlığı; ilan silinmişse boş döner. */
async function listingTitle(listingId: string | null): Promise<{ title: string } | null> {
  if (!listingId) return null;
  try {
    const { data } = await serviceClient()
      .from<{ title: string }>("listings")
      .select("title")
      .eq("id", listingId)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

/**
 * Karşı tarafın görünen adı. Bildirim tercihinden bağımsızdır: burada
 * kimseye e-posta gönderilmiyor, yalnızca metinde adı geçiyor.
 */
async function displayName(userId: string): Promise<string> {
  try {
    const { data } = await serviceClient()
      .from<{ display_name: string | null }>("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();
    return data?.display_name?.trim() || "Voisini";
  } catch {
    return "Voisini";
  }
}

/** Alıcının adresi, dili ve bildirim tercihi. Servis anahtarı gerektirir. */
async function mailTarget(userId: string): Promise<MailTarget | null> {
  try {
    const { data, error } = await serviceClient().rpc<MailTarget | null>("mail_target", {
      p_user: userId,
    });
    if (error || !data || !data.email) return null;
    if (!data.opted_in || data.banned) return null;
    return data;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ şablon */

function layout(opts: {
  dir: "ltr" | "rtl";
  greeting: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  why: string;
  off: string;
}): string {
  const { dir, greeting, body, ctaLabel, ctaHref, why, off } = opts;
  const align = dir === "rtl" ? "right" : "left";

  return `<!doctype html>
<html dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f1ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ec;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
        <tr><td style="background:#0a6b54;padding:20px 28px;">
          <span style="color:#ffffff;font-size:19px;font-weight:800;letter-spacing:-.02em;">voisini</span>
        </td></tr>
        <tr><td style="padding:30px 28px 8px;text-align:${align};">
          <p style="margin:0 0 14px;font-size:15px;color:#0a1310;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 26px;font-size:16px;line-height:1.6;color:#364842;">${escapeHtml(body)}</p>
          <a href="${ctaHref}"
             style="display:inline-block;background:#0a6b54;color:#ffffff;text-decoration:none;
                    padding:12px 22px;border-radius:9px;font-size:15px;font-weight:700;">${escapeHtml(ctaLabel)}</a>
        </td></tr>
        <tr><td style="padding:28px;text-align:${align};">
          <hr style="border:none;border-top:1px solid #e2e2da;margin:0 0 14px;">
          <p style="margin:0 0 4px;font-size:12px;line-height:1.5;color:#6b807a;">${escapeHtml(why)}</p>
          <p style="margin:0;font-size:12px;line-height:1.5;color:#6b807a;">${escapeHtml(off)}</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#8a968f;font-family:Arial,sans-serif;">voisini.com</p>
    </td></tr>
  </table>
</body></html>`;
}

async function deliver(opts: {
  target: MailTarget;
  subject: string;
  body: string;
  ctaLabel: string;
  path: string;
  idempotencyKey?: string;
}) {
  const locale: Locale = isLocale(opts.target.locale) ? (opts.target.locale as Locale) : "fr";
  const t = getDictionary(locale);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const href = `${siteUrl()}/${locale}${opts.path}`;
  const greeting = fill(t.emails.greeting, { name: opts.target.name });

  const html = layout({
    dir,
    greeting,
    body: opts.body,
    ctaLabel: opts.ctaLabel,
    ctaHref: href,
    why: t.emails.why,
    off: t.emails.off,
  });

  const text = `${greeting}\n\n${opts.body}\n\n${opts.ctaLabel}: ${href}\n\n${t.emails.why}\n${t.emails.off}`;

  await sendEmail({
    to: opts.target.email,
    subject: opts.subject,
    html,
    text,
    idempotencyKey: opts.idempotencyKey,
  });
}

/* -------------------------------------------------------------- olay bazlı */

/** Sohbetteki diğer kişiye "yeni mesajın var" e-postası. */
export async function mailNewMessage(conversationId: string, senderId: string) {
  try {
    const client = serviceClient();
    const { data: conv } = await client
      .from<{ buyer_id: string; seller_id: string; listing_id: string | null }>("conversations")
      .select("buyer_id,seller_id,listing_id")
      .eq("id", conversationId)
      .maybeSingle();
    if (!conv) return;

    const recipientId = conv.buyer_id === senderId ? conv.seller_id : conv.buyer_id;
    if (!recipientId || recipientId === senderId) return;

    const [target, senderName, listing] = await Promise.all([
      mailTarget(recipientId),
      displayName(senderId),
      listingTitle(conv.listing_id),
    ]);
    if (!target) return;

    const locale: Locale = isLocale(target.locale) ? (target.locale as Locale) : "fr";
    const t = getDictionary(locale);
    const values = { name: senderName, listing: listing?.title ?? "" };

    await deliver({
      target,
      subject: fill(t.emails.newMessageSubject, values),
      body: fill(t.emails.newMessageBody, values),
      ctaLabel: t.emails.newMessageCta,
      path: `/messages/${conversationId}`,
    });
  } catch (error) {
    console.error("[email] mailNewMessage", error);
  }
}

/** İlan sahibine "yeni talep" e-postası. */
export async function mailDealRequested(transactionId: string) {
  try {
    const client = serviceClient();
    const { data: tx } = await client
      .from<{ buyer_id: string; seller_id: string; listing_id: string | null }>("transactions")
      .select("buyer_id,seller_id,listing_id")
      .eq("id", transactionId)
      .maybeSingle();
    if (!tx) return;

    const [target, buyerName, listing] = await Promise.all([
      mailTarget(tx.seller_id),
      displayName(tx.buyer_id),
      listingTitle(tx.listing_id),
    ]);
    if (!target) return;

    const locale: Locale = isLocale(target.locale) ? (target.locale as Locale) : "fr";
    const t = getDictionary(locale);
    const values = { name: buyerName, listing: listing?.title ?? "" };

    await deliver({
      target,
      subject: fill(t.emails.dealRequestSubject, values),
      body: fill(t.emails.dealRequestBody, values),
      ctaLabel: t.emails.dealCta,
      path: "/deals",
      idempotencyKey: `deal-request-${transactionId}`,
    });
  } catch (error) {
    console.error("[email] mailDealRequested", error);
  }
}

/** Talep sahibine "kabul edildi / reddedildi" e-postası. */
export async function mailDealAnswered(transactionId: string, accepted: boolean) {
  try {
    const client = serviceClient();
    const { data: tx } = await client
      .from<{ buyer_id: string; seller_id: string; listing_id: string | null }>("transactions")
      .select("buyer_id,seller_id,listing_id")
      .eq("id", transactionId)
      .maybeSingle();
    if (!tx) return;

    const [target, sellerName, listing] = await Promise.all([
      mailTarget(tx.buyer_id),
      displayName(tx.seller_id),
      listingTitle(tx.listing_id),
    ]);
    if (!target) return;

    const locale: Locale = isLocale(target.locale) ? (target.locale as Locale) : "fr";
    const t = getDictionary(locale);
    const values = { name: sellerName, listing: listing?.title ?? "" };

    await deliver({
      target,
      subject: accepted ? t.emails.dealAcceptedSubject : t.emails.dealDeclinedSubject,
      body: fill(accepted ? t.emails.dealAcceptedBody : t.emails.dealDeclinedBody, values),
      ctaLabel: t.emails.dealCta,
      path: "/deals",
      idempotencyKey: `deal-answer-${transactionId}-${accepted ? "y" : "n"}`,
    });
  } catch (error) {
    console.error("[email] mailDealAnswered", error);
  }
}

/* ----------------------------------------------------- günlük görevler */

/** Ödünç/kiralamada iade tarihi yaklaşan tarafa hatırlatma. */
export async function mailReturnReminder(row: {
  transaction_id: string;
  buyer_id: string;
  seller_id: string;
  listing_title: string | null;
  due_at: string;
}) {
  try {
    const [target, ownerName] = await Promise.all([
      mailTarget(row.buyer_id),
      displayName(row.seller_id),
    ]);
    if (!target) return;

    const locale: Locale = isLocale(target.locale) ? (target.locale as Locale) : "fr";
    const t = getDictionary(locale);
    const date = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
    }).format(new Date(row.due_at));

    const values = { listing: row.listing_title ?? "", name: ownerName, date };

    await deliver({
      target,
      subject: fill(t.emails.returnSubject, values),
      body: fill(t.emails.returnBody, values),
      ctaLabel: t.emails.returnCta,
      path: "/deals",
      idempotencyKey: `return-${row.transaction_id}`,
    });
  } catch (error) {
    console.error("[email] mailReturnReminder", error);
  }
}

/** Haftalık özet: çevredeki yeni ilanlar. */
export async function mailWeeklyDigest(row: {
  user_id: string;
  new_count: number;
  samples: string[] | null;
}) {
  try {
    const target = await mailTarget(row.user_id);
    if (!target || row.new_count < 1) return;

    const locale: Locale = isLocale(target.locale) ? (target.locale as Locale) : "fr";
    const t = getDictionary(locale);
    const samples = (row.samples ?? []).filter(Boolean).slice(0, 3).join(", ");
    const values = { count: String(row.new_count), samples };

    await deliver({
      target,
      subject: fill(t.emails.digestSubject, values),
      body: fill(t.emails.digestBody, values),
      ctaLabel: t.emails.digestCta,
      path: "/listings",
      idempotencyKey: `digest-${row.user_id}-${new Date().toISOString().slice(0, 10)}`,
    });
  } catch (error) {
    console.error("[email] mailWeeklyDigest", error);
  }
}

/** Kayıtlı aramaya uyan yeni ilanlar çıktığında. */
export async function mailSearchAlert(row: {
  search_id: string;
  user_id: string;
  label: string;
  new_count: number;
  samples: string[] | null;
}) {
  try {
    const target = await mailTarget(row.user_id);
    if (!target || row.new_count < 1) return;

    const locale: Locale = isLocale(target.locale) ? (target.locale as Locale) : "fr";
    const t = getDictionary(locale);
    const samples = (row.samples ?? []).filter(Boolean).slice(0, 3).join(", ");
    const values = { count: String(row.new_count), label: row.label, samples };

    await deliver({
      target,
      subject: fill(t.emails.alertSubject, values),
      body: fill(t.emails.alertBody, values),
      ctaLabel: t.emails.alertCta,
      path: "/listings",
      idempotencyKey: `alert-${row.search_id}-${new Date().toISOString().slice(0, 10)}`,
    });
  } catch (error) {
    console.error("[email] mailSearchAlert", error);
  }
}
