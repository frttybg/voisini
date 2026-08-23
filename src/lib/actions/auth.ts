"use server";

import { redirect } from "next/navigation";
import { publicEnv, isSupabaseConfigured } from "@/lib/env";
import {
  requestPasswordReset,
  resendConfirmation,
  signInWithPassword,
  signOutRemote,
  signUp,
  updateUser,
} from "@/lib/supabase/auth";
import {
  clearSessionCookies,
  getSession,
  writeSessionCookies,
} from "@/lib/supabase/session";
import { userClient } from "@/lib/supabase/server";
import { EMAIL_RE, isStrongPassword } from "@/lib/validation";
import { fail, rateLimit, succeed, type ActionState } from "./shared";

function siteUrl() {
  return publicEnv.siteUrl.replace(/\/$/, "");
}

export async function signUpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured) return fail("notConfigured");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const locale = String(formData.get("locale") ?? "fr");

  const errors: Record<string, string> = {};
  if (!EMAIL_RE.test(email)) errors.email = "invalidEmail";
  if (!isStrongPassword(password)) errors.password = "weakPassword";
  if (password !== confirm) errors.confirm = "passwordMismatch";
  if (displayName.length < 2) errors.displayName = "tooShort";
  if (Object.keys(errors).length) return { ok: false, errors };

  if (!(await rateLimit("signup", 5, 3600))) return fail("rateLimited");

  const { data, error } = await signUp({
    email,
    password,
    redirectTo: `${siteUrl()}/auth/callback?next=/${locale}/onboarding`,
    data: { display_name: displayName, locale },
  });

  if (error) return fail(error.message);

  // E-posta doğrulaması kapalıysa Supabase doğrudan oturum döndürür
  const session = data?.session ?? (data?.access_token ? (data as never) : null);
  if (session && (session as { access_token?: string }).access_token) {
    await writeSessionCookies(session as never);
    return succeed(undefined, { redirect: `/${locale}/onboarding` });
  }

  return succeed("checkEmail", { data: { email } });
}

export async function signInAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured) return fail("notConfigured");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "fr");
  const next = String(formData.get("next") ?? "");

  if (!EMAIL_RE.test(email) || !password) {
    return { ok: false, errors: { email: !EMAIL_RE.test(email) ? "invalidEmail" : "", password: !password ? "required" : "" } };
  }

  if (!(await rateLimit("signin", 10, 600, email))) return fail("rateLimited");

  const { data, error } = await signInWithPassword({ email, password });
  if (error || !data) return fail(error?.message ?? "error");

  await writeSessionCookies(data);

  const { client } = await userClient();
  const { data: profile } = await client
    .from<{ onboarding_step: number }>("profiles")
    .select("onboarding_step")
    .eq("id", data.user.id)
    .maybeSingle();

  const target =
    next && next.startsWith("/")
      ? next
      : profile && profile.onboarding_step < 4
        ? `/${locale}/onboarding`
        : `/${locale}/listings`;

  return succeed(undefined, { redirect: target });
}

export async function signOutAction(locale: string) {
  const session = await getSession();
  if (session?.accessToken) await signOutRemote(session.accessToken);
  await clearSessionCookies();
  redirect(`/${locale}`);
}

export async function requestResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured) return fail("notConfigured");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const locale = String(formData.get("locale") ?? "fr");
  if (!EMAIL_RE.test(email)) return { ok: false, errors: { email: "invalidEmail" } };

  if (!(await rateLimit("reset", 5, 3600, email))) return fail("rateLimited");

  await requestPasswordReset(
    email,
    `${siteUrl()}/auth/callback?next=/${locale}/reset-password&type=recovery`,
  );
  // Kullanıcı numaralandırmasını önlemek için her durumda aynı yanıt
  return succeed("checkEmail");
}

export async function updatePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const locale = String(formData.get("locale") ?? "fr");

  if (!isStrongPassword(password)) return { ok: false, errors: { password: "weakPassword" } };
  if (password !== confirm) return { ok: false, errors: { confirm: "passwordMismatch" } };

  const session = await getSession();
  if (!session) return fail("forbidden");

  const { error } = await updateUser(session.accessToken, { password });
  if (error) return fail(error.message);

  return succeed(undefined, { redirect: `/${locale}/listings` });
}

export async function resendConfirmationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const locale = String(formData.get("locale") ?? "fr");
  if (!EMAIL_RE.test(email)) return { ok: false, errors: { email: "invalidEmail" } };
  if (!(await rateLimit("resend", 3, 3600, email))) return fail("rateLimited");
  await resendConfirmation(email, `${siteUrl()}/auth/callback?next=/${locale}/onboarding`);
  return succeed("checkEmail");
}
