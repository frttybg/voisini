import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale, isLocale, matchLocale, type Locale } from "@/lib/i18n/config";

const ACCESS_COOKIE = "vsi-at";
const REFRESH_COOKIE = "vsi-rt";
const LOCALE_COOKIE = "vsi-locale";

/** Giriş gerektiren yollar (dil öneki hariç) */
const PROTECTED = [
  "/new", "/messages", "/favorites", "/profile", "/onboarding",
  "/admin", "/deals", "/notifications",
];

const PUBLIC_FILE = /\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|json|webmanifest)$/i;

function decodeExp(jwt: string): number | null {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    return json.exp ?? null;
  } catch {
    return null;
  }
}

async function refreshTokens(refreshToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // --- 1. Dil algılama ---------------------------------------------------
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (!isLocale(first)) {
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale: Locale = isLocale(cookieLocale)
      ? cookieLocale
      : matchLocale(request.headers.get("accept-language"));
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    const redirect = NextResponse.redirect(url);
    redirect.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return redirect;
  }

  const locale = first as Locale;
  const pathWithoutLocale = `/${segments.slice(1).join("/")}`;

  const response = NextResponse.next();
  if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  // --- 2. Oturum yenileme ------------------------------------------------
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  let authenticated = false;

  if (access) {
    const exp = decodeExp(access);
    authenticated = !!exp && exp - 30 > Math.floor(Date.now() / 1000);
  }

  if (!authenticated && refresh) {
    const tokens = await refreshTokens(refresh);
    if (tokens) {
      authenticated = true;
      const secure = process.env.NODE_ENV === "production";
      response.cookies.set(ACCESS_COOKIE, tokens.access_token, {
        httpOnly: true, sameSite: "lax", path: "/", secure, maxAge: tokens.expires_in,
      });
      response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
        httpOnly: true, sameSite: "lax", path: "/", secure, maxAge: 60 * 60 * 24 * 30,
      });
    } else {
      response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
      response.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
    }
  }

  // --- 3. Korumalı yollar ------------------------------------------------
  const needsAuth = PROTECTED.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`),
  );

  if (needsAuth && !authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
