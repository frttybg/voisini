import { cookies } from "next/headers";
import { decodeJwtExp, decodeJwtSub, refreshSession, type AuthTokens } from "./auth";

export const ACCESS_COOKIE = "vsi-at";
export const REFRESH_COOKIE = "vsi-rt";

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  expiresAt: number;
};

/**
 * Geçerli oturumu döndürür. Süresi dolmuşsa yeniler ve
 * (mümkünse) çerezleri günceller. RSC içinde çerez yazılamadığında
 * yalnızca bellek içi taze token döndürülür — kalıcı yenileme
 * middleware tarafından yapılır.
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  const refresh = store.get(REFRESH_COOKIE)?.value;
  if (!access && !refresh) return null;

  if (access) {
    const exp = decodeJwtExp(access);
    const sub = decodeJwtSub(access);
    if (exp && sub && exp - 30 > Math.floor(Date.now() / 1000)) {
      return { accessToken: access, refreshToken: refresh ?? "", userId: sub, expiresAt: exp };
    }
  }

  if (!refresh) return null;

  const { data, error } = await refreshSession(refresh);
  if (error || !data) return null;

  await writeSessionCookies(data).catch(() => {
    /* RSC içinde çerez yazılamaz — sorun değil, middleware halleder */
  });

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    userId: data.user?.id ?? decodeJwtSub(data.access_token) ?? "",
    expiresAt: decodeJwtExp(data.access_token) ?? 0,
  };
}

export async function writeSessionCookies(tokens: AuthTokens) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, tokens.access_token, {
    ...baseCookieOptions,
    maxAge: tokens.expires_in ?? 3600,
  });
  store.set(REFRESH_COOKIE, tokens.refresh_token, {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.set(ACCESS_COOKIE, "", { ...baseCookieOptions, maxAge: 0 });
  store.set(REFRESH_COOKIE, "", { ...baseCookieOptions, maxAge: 0 });
}
