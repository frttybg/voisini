import { NextResponse } from "next/server";
import { exchangeCodeForSession, verifyOtp } from "@/lib/supabase/auth";
import { writeSessionCookies } from "@/lib/supabase/session";
import { defaultLocale } from "@/lib/i18n/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Supabase e-posta bağlantılarının döndüğü nokta.
 *
 * Supabase iki farklı biçimde geri dönebilir:
 *
 *  1. Adres satırında  ?token_hash=…  veya  ?code=…
 *     → burada, sunucuda doğrulanır.
 *
 *  2. Adresin # işaretinden sonrasında  #access_token=…&refresh_token=…
 *     (varsayılan e-posta şablonunun kullandığı yöntem)
 *     → # işaretinden sonrası sunucuya HİÇ gönderilmez. Bu yüzden küçük
 *       bir sayfa döndürüp tarayıcıdan okutuyor ve /api/auth/session'a
 *       ilettiriyoruz.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const code = url.searchParams.get("code");
  const type = (url.searchParams.get("type") ?? "signup") as
    | "signup"
    | "recovery"
    | "email_change"
    | "magiclink"
    | "invite";
  const nextParam = url.searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : `/${defaultLocale}`;

  // Şifre yenileme bağlantısında dil bilgisini `next`ten koruyoruz.
  const localeFromNext = next.split("/")[1] || defaultLocale;
  const recoveryNext = `/${localeFromNext}/reset-password`;

  // --- 1. Sunucuda doğrulanabilen biçimler ------------------------------
  if (tokenHash || code) {
    const result = tokenHash
      ? await verifyOtp({ token_hash: tokenHash, type })
      : await exchangeCodeForSession(code as string);

    if (result.data) {
      await writeSessionCookies(result.data);
      const target =
        type === "recovery" && !next.includes("reset-password") ? recoveryNext : next;
      return NextResponse.redirect(new URL(target, url.origin));
    }
    return NextResponse.redirect(
      new URL(`/${defaultLocale}/login?error=link`, url.origin),
    );
  }

  // --- 2. Adres parçası (#) biçimi — tarayıcıya okutuyoruz --------------
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Voisini</title>
<style>
  body{margin:0;min-height:100dvh;display:grid;place-items:center;
       font:16px/1.5 ui-sans-serif,system-ui,sans-serif;background:#fbfaf7;color:#0a1310}
  @media (prefers-color-scheme:dark){body{background:#07100d;color:#f2f6f4}}
  .box{display:flex;flex-direction:column;align-items:center;gap:14px}
  .dot{width:26px;height:26px;border-radius:50%;border:2.5px solid #12a97f;
       border-top-color:transparent;animation:spin .8s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  @media (prefers-reduced-motion:reduce){.dot{animation:none}}
</style>
</head>
<body>
<div class="box"><div class="dot"></div><p id="msg">Doğrulanıyor…</p></div>
<script>
(function () {
  var next = ${JSON.stringify(next)};
  var fallback = ${JSON.stringify(`/${defaultLocale}/login`)};
  var hash = window.location.hash.replace(/^#/, "");
  var params = new URLSearchParams(hash);

  var error = params.get("error_code") || params.get("error");
  if (error) {
    window.location.replace(fallback + "?error=link");
    return;
  }

  var accessToken = params.get("access_token");
  var refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) {
    window.location.replace(fallback + "?error=link");
    return;
  }

  // Şifre yenileme bağlantısı her zaman yeni şifre ekranında bitmeli.
  if (params.get("type") === "recovery" && next.indexOf("reset-password") === -1) {
    next = ${JSON.stringify(recoveryNext)};
  }

  fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken })
  })
    .then(function (res) {
      if (!res.ok) throw new Error("session");
      window.location.replace(next);
    })
    .catch(function () {
      window.location.replace(fallback + "?error=link");
    });
})();
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
