/**
 * Supabase Auth (GoTrue) REST çağrıları — bağımlılıksız.
 */
import { publicEnv } from "@/lib/env";

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: AuthUser;
};

export type AuthUser = {
  id: string;
  email?: string;
  phone?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  created_at: string;
  user_metadata: Record<string, unknown>;
};

export type AuthResult<T> = { data: T; error: null } | { data: null; error: AuthError };

export class AuthError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

function authUrl(path: string) {
  return `${publicEnv.supabaseUrl}/auth/v1${path}`;
}

async function authFetch<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<AuthResult<T>> {
  const { token, ...rest } = init;
  try {
    const res = await fetch(authUrl(path), {
      ...rest,
      headers: {
        apikey: publicEnv.supabaseAnonKey,
        "Content-Type": "application/json",
        Authorization: `Bearer ${token ?? publicEnv.supabaseAnonKey}`,
        ...(rest.headers as Record<string, string> | undefined),
      },
      cache: "no-store",
    });
    const text = await res.text();
    const payload = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const info = (payload ?? {}) as Record<string, unknown>;
      const msg =
        (info.msg as string) ||
        (info.error_description as string) ||
        (info.message as string) ||
        `Kimlik doğrulama hatası (${res.status})`;
      return {
        data: null,
        error: new AuthError(msg, res.status, (info.error_code as string) ?? (info.code as string)),
      };
    }
    return { data: payload as T, error: null };
  } catch (e) {
    return { data: null, error: new AuthError((e as Error).message, 0) };
  }
}

export function signUp(params: {
  email: string;
  password: string;
  redirectTo: string;
  data?: Record<string, unknown>;
}) {
  return authFetch<{ user: AuthUser; session: AuthTokens | null } & Partial<AuthTokens>>(
    `/signup?redirect_to=${encodeURIComponent(params.redirectTo)}`,
    {
      method: "POST",
      body: JSON.stringify({
        email: params.email,
        password: params.password,
        data: params.data ?? {},
      }),
    },
  );
}

export function signInWithPassword(params: { email: string; password: string }) {
  return authFetch<AuthTokens>("/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email: params.email, password: params.password }),
  });
}

export function refreshSession(refreshToken: string) {
  return authFetch<AuthTokens>("/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export function requestPasswordReset(email: string, redirectTo: string) {
  return authFetch<Record<string, never>>(
    `/recover?redirect_to=${encodeURIComponent(redirectTo)}`,
    { method: "POST", body: JSON.stringify({ email }) },
  );
}

export function resendConfirmation(email: string, redirectTo: string) {
  return authFetch<Record<string, never>>(
    `/resend?redirect_to=${encodeURIComponent(redirectTo)}`,
    { method: "POST", body: JSON.stringify({ type: "signup", email }) },
  );
}

/** E-posta bağlantısındaki token_hash'i oturuma çevirir. */
export function verifyOtp(params: {
  token_hash: string;
  type: "signup" | "recovery" | "email_change" | "magiclink" | "invite";
}) {
  return authFetch<AuthTokens>("/verify", {
    method: "POST",
    body: JSON.stringify({ token_hash: params.token_hash, type: params.type }),
  });
}

export function exchangeCodeForSession(code: string, codeVerifier?: string) {
  return authFetch<AuthTokens>("/token?grant_type=pkce", {
    method: "POST",
    body: JSON.stringify({ auth_code: code, code_verifier: codeVerifier ?? "" }),
  });
}

export function updateUser(token: string, attrs: Record<string, unknown>) {
  return authFetch<AuthUser>("/user", {
    method: "PUT",
    token,
    body: JSON.stringify(attrs),
  });
}

export function getUser(token: string) {
  return authFetch<AuthUser>("/user", { method: "GET", token });
}

export function signOutRemote(token: string) {
  return authFetch<Record<string, never>>("/logout", { method: "POST", token });
}

/** JWT'nin exp alanını okur (imza doğrulaması sunucuda PostgREST tarafından yapılır). */
export function decodeJwtExp(jwt: string): number | null {
  try {
    const [, payload] = jwt.split(".");
    if (!payload) return null;
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    ) as { exp?: number };
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

export function decodeJwtSub(jwt: string): string | null {
  try {
    const [, payload] = jwt.split(".");
    if (!payload) return null;
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    ) as { sub?: string };
    return json.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * Bir kullanıcıyı kalıcı olarak siler (GoTrue yönetici uçları).
 *
 * Yalnızca sunucudan, servis anahtarıyla çağrılır. auth.users'tan silinen
 * satır profiles'a, oradan da ilanlara, mesajlara ve işlemlere zincirleme
 * yansır — veritabanındaki "on delete cascade" kuralları hallediyor.
 */
export async function adminDeleteUser(userId: string): Promise<boolean> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = publicEnv.supabaseUrl;
  if (!key || !url) return false;

  try {
    const res = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    return res.ok;
  } catch (error) {
    console.error("[auth] adminDeleteUser", error);
    return false;
  }
}
