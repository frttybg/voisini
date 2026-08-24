import { NextResponse } from "next/server";
import { getSession } from "@/lib/supabase/session";
import { publicEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Anlık mesajlaşma için kısa ömürlü erişim jetonu.
 *
 * Oturum jetonlarımız httpOnly çerezlerde durur ve sayfa koduna kapalıdır.
 * WebSocket bağlantısı ise tarayıcıdan kurulduğu için jetonu bilmek
 * zorunda. Burada YALNIZCA erişim jetonu (access_token) veriliyor —
 * yenileme jetonu (refresh_token) asla dışarı çıkmaz. Böylece jetonun
 * ömrü bir saatle sınırlı kalır ve oturum ele geçirilemez.
 */
export async function GET() {
  const session = await getSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      token: session.accessToken,
      expiresAt: session.expiresAt,
      url: publicEnv.supabaseUrl,
      apikey: publicEnv.supabaseAnonKey,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
