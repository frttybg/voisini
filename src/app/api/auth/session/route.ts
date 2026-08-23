import { NextResponse } from "next/server";
import { getUser, decodeJwtExp } from "@/lib/supabase/auth";
import { writeSessionCookies } from "@/lib/supabase/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * E-posta bağlantısından gelen oturumu çereze yazar.
 *
 * Güvenlik: gönderilen access_token Supabase'e sorulup GERÇEKTEN geçerli
 * olduğu doğrulanmadan hiçbir çerez yazılmaz. Böylece rastgele bir değer
 * göndererek oturum açılamaz.
 */
export async function POST(request: Request) {
  let body: { access_token?: string; refresh_token?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const accessToken = body.access_token;
  const refreshToken = body.refresh_token;

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: "missing_tokens" }, { status: 400 });
  }

  const { data: user, error } = await getUser(accessToken);
  if (error || !user?.id) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const exp = decodeJwtExp(accessToken);
  const expiresIn = exp ? Math.max(exp - Math.floor(Date.now() / 1000), 60) : 3600;

  await writeSessionCookies({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    token_type: "bearer",
    user,
  });

  return NextResponse.json({ ok: true });
}
