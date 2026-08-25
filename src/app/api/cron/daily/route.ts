import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/server";
import { mailReturnReminder, mailSearchAlert, mailWeeklyDigest } from "@/lib/email/notify";
import { emailEnabled } from "@/lib/email/send";
import { adminDeleteUser } from "@/lib/supabase/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Günde bir kez çalışan görev (vercel.json içinde tanımlı).
 *
 *   • İade tarihi yaklaşan ödünç ve kiralamalar için hatırlatma
 *   • Pazartesi günleri haftalık özet e-postası
 *
 * Vercel, CRON_SECRET tanımlıysa isteği "Authorization: Bearer …"
 * başlığıyla gönderir. Başlık uymuyorsa istek reddedilir — böylece
 * adresi bilen biri görevi elle tetikleyemez.
 */

type ReminderRow = {
  transaction_id: string;
  buyer_id: string;
  seller_id: string;
  kind: string;
  listing_title: string | null;
  due_at: string;
};

type AlertRow = {
  search_id: string;
  user_id: string;
  label: string;
  new_count: number;
  samples: string[] | null;
};

type DigestRow = {
  user_id: string;
  new_count: number;
  samples: string[] | null;
};

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const client = serviceClient();
  const result = { reminders: 0, alerts: 0, digests: 0, purged: 0 };

  // 1. İade hatırlatmaları — her gün (e-posta kapalıysa atlanır)
  if (emailEnabled) try {
    const { data, error } = await client.rpc<ReminderRow[]>("pending_return_reminders");
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        await mailReturnReminder(row);
        result.reminders += 1;
      }
    }
  } catch (error) {
    console.error("[cron] iade hatırlatmaları", error);
  }

  // 2. Arama alarmları — her gün
  if (emailEnabled) try {
    const { data, error } = await client.rpc<AlertRow[]>("pending_search_alerts", {
      p_limit: 300,
    });
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        await mailSearchAlert(row);
        result.alerts += 1;
      }
    }
  } catch (error) {
    console.error("[cron] arama alarmları", error);
  }

  // 3. Haftalık özet — yalnızca pazartesi
  const isMonday = new Date().getUTCDay() === 1;
  if (isMonday && emailEnabled) {
    try {
      const { data, error } = await client.rpc<DigestRow[]>("weekly_digest", { p_limit: 500 });
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          await mailWeeklyDigest(row);
          result.digests += 1;
        }
      }
    } catch (error) {
      console.error("[cron] haftalık özet", error);
    }
  }

  // 4. Süresi dolan hesap silme talepleri — her gün
  try {
    const { data, error } = await client.rpc<string[]>("expired_deletions", { p_limit: 50 });
    if (!error && Array.isArray(data)) {
      for (const userId of data) {
        if (await adminDeleteUser(userId)) result.purged += 1;
      }
    }
  } catch (error) {
    console.error("[cron] hesap silme", error);
  }

  return NextResponse.json({ ok: true, ...result });
}
