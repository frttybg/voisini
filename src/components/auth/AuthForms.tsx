"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/layout/Logo";
import {
  requestResetAction,
  resendConfirmationAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
} from "@/lib/actions/auth";
import { idleState } from "@/lib/actions/state";
import { useActionSuccess } from "@/lib/useActionSuccess";
import type { Dictionary } from "@/lib/i18n";

function errorText(t: Dictionary, key?: string) {
  if (!key) return undefined;
  const map: Record<string, string> = {
    invalidEmail: t.errors.invalidEmail,
    weakPassword: t.errors.weakPassword,
    passwordMismatch: t.errors.passwordMismatch,
    tooShort: t.errors.tooShort,
    tooLong: t.errors.tooLong,
    required: t.common.required,
    taken: t.errors.forbidden,
    invalid: t.common.error,
  };
  return map[key] ?? key;
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { locale } = useI18n();
  return (
    <div className="relative flex min-h-[80svh] items-center justify-center overflow-hidden px-5 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(60% 50% at 50% 0%, var(--hero-glow-a), transparent 70%)" }}
      />
      <div className="w-full max-w-md">
        <Link href={`/${locale}`} className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-raised)] p-7 shadow-[var(--shadow-card)]">
          <h1 className="display-sm mb-1 text-[var(--ink)]">{title}</h1>
          <p className="mb-6 text-sm text-[var(--ink-muted)]">{subtitle}</p>
          {children}
        </div>
        {footer ? <div className="mt-5 text-center text-sm text-[var(--ink-muted)]">{footer}</div> : null}
      </div>
    </div>
  );
}

function Banner({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <div
      className="mb-4 flex items-start gap-2 rounded-[var(--radius-md)] px-3.5 py-3 text-[0.8125rem]"
      style={{
        background:
          tone === "error"
            ? "color-mix(in oklab, var(--danger) 10%, transparent)"
            : "color-mix(in oklab, var(--success) 12%, transparent)",
        color: tone === "error" ? "var(--danger)" : "var(--success)",
      }}
    >
      <Icon name={tone === "error" ? "alert" : "check"} size={15} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ Login */

export function LoginForm() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const search = useSearchParams();
  const [state, formAction, pending] = useActionState(signInAction, idleState);

  useActionSuccess(state, () => {
    if (state.redirect) router.push(state.redirect);
  });

  return (
    <AuthShell
      title={t.auth.loginTitle}
      subtitle={t.auth.loginSubtitle}
      footer={
        <>
          {t.auth.noAccount}{" "}
          <Link href={`/${locale}/register`} className="font-semibold text-[var(--brand-600)] hover:underline">
            {t.auth.signUp}
          </Link>
        </>
      }
    >
      {search.get("error") === "link" ? (
        <Banner tone="error">
          {t.auth.linkExpired}{" "}
          <Link href={`/${locale}/register`} className="font-semibold underline">
            {t.auth.signUp}
          </Link>
        </Banner>
      ) : null}

      {state.message ? (
        <Banner tone="error">
          {state.message === "notConfigured" ? t.errors.notConfigured : state.message}
        </Banner>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="next" value={search.get("next") ?? ""} />

        <div>
          <Label htmlFor="email" required>{t.auth.email}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" icon="send" required />
          <FieldError>{errorText(t, state.errors?.email)}</FieldError>
        </div>

        <div>
          <Label htmlFor="password" required>{t.auth.password}</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" icon="key" required />
          <FieldError>{errorText(t, state.errors?.password)}</FieldError>
        </div>

        <Link
          href={`/${locale}/forgot-password`}
          className="-mt-1 self-end text-[0.8125rem] text-[var(--ink-muted)] hover:text-[var(--brand-600)]"
        >
          {t.auth.forgotPassword}
        </Link>

        <Button type="submit" size="lg" full loading={pending}>
          {t.auth.signIn}
        </Button>
      </form>
    </AuthShell>
  );
}

/* --------------------------------------------------------------- Register */

export function RegisterForm() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const search = useSearchParams();
  const [state, formAction, pending] = useActionState(signUpAction, idleState);
  const [resendState, resendAction, resendPending] = useActionState(
    resendConfirmationAction,
    idleState,
  );

  useActionSuccess(state, () => {
    if (state.redirect) router.push(state.redirect);
  });

  if (state.ok && state.message === "checkEmail") {
    const email = String(state.data?.email ?? "");
    return (
      <AuthShell title={t.auth.checkEmail} subtitle={t.auth.checkEmailText}>
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-600)]">
            <Icon name="send" size={28} />
          </span>
          <p className="text-sm font-semibold text-[var(--ink)]">{email}</p>
          {resendState.ok ? <Banner tone="success">{t.auth.checkEmail}</Banner> : null}
          <form action={resendAction}>
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="outline" size="sm" loading={resendPending}>
              {t.auth.resend}
            </Button>
          </form>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t.auth.registerTitle}
      subtitle={t.auth.registerSubtitle}
      footer={
        <>
          {t.auth.hasAccount}{" "}
          <Link href={`/${locale}/login`} className="font-semibold text-[var(--brand-600)] hover:underline">
            {t.auth.signIn}
          </Link>
        </>
      }
    >
      {state.message && !state.ok ? (
        <Banner tone="error">
          {state.message === "notConfigured"
            ? t.errors.notConfigured
            : state.message === "rateLimited"
              ? t.errors.rateLimited
              : state.message}
        </Banner>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="ref" value={search.get("ref") ?? ""} />

        <div>
          <Label htmlFor="displayName" required>{t.auth.displayName}</Label>
          <Input id="displayName" name="displayName" autoComplete="name" icon="user" required />
          <FieldError>{errorText(t, state.errors?.displayName)}</FieldError>
        </div>

        <div>
          <Label htmlFor="email" required>{t.auth.email}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" icon="send" required />
          <FieldError>{errorText(t, state.errors?.email)}</FieldError>
        </div>

        <div>
          <Label htmlFor="password" required hint={t.auth.passwordHint}>{t.auth.password}</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" icon="key" required />
          <FieldError>{errorText(t, state.errors?.password)}</FieldError>
        </div>

        <div>
          <Label htmlFor="confirm" required>{t.auth.passwordAgain}</Label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" icon="key" required />
          <FieldError>{errorText(t, state.errors?.confirm)}</FieldError>
        </div>

        <Button type="submit" size="lg" full loading={pending}>
          {t.auth.signUp}
        </Button>

        <p className="text-center text-[0.75rem] leading-relaxed text-[var(--ink-muted)]">
          {t.auth.terms}
          <br />
          <Link href={`/${locale}/legal/terms`} className="underline hover:text-[var(--brand-600)]">
            {t.footer.terms}
          </Link>
          {" · "}
          <Link href={`/${locale}/legal/privacy`} className="underline hover:text-[var(--brand-600)]">
            {t.footer.privacy}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

/* ------------------------------------------------------- Şifre sıfırlama */

export function ForgotPasswordForm() {
  const { t, locale } = useI18n();
  const [state, formAction, pending] = useActionState(requestResetAction, idleState);

  return (
    <AuthShell
      title={t.auth.resetTitle}
      subtitle={t.auth.resetSubtitle}
      footer={
        <Link href={`/${locale}/login`} className="font-semibold text-[var(--brand-600)] hover:underline">
          {t.auth.signIn}
        </Link>
      }
    >
      {state.ok ? <Banner tone="success">{t.auth.checkEmailText}</Banner> : null}
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <Label htmlFor="email" required>{t.auth.email}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" icon="send" required />
          <FieldError>{errorText(t, state.errors?.email)}</FieldError>
        </div>
        <Button type="submit" size="lg" full loading={pending}>
          {t.auth.sendLink}
        </Button>
      </form>
    </AuthShell>
  );
}

export function ResetPasswordForm() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updatePasswordAction, idleState);

  useActionSuccess(state, () => {
    if (state.redirect) router.push(state.redirect);
  });

  return (
    <AuthShell title={t.auth.newPassword} subtitle={t.auth.passwordHint}>
      {state.message && !state.ok ? <Banner tone="error">{state.message}</Banner> : null}
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <Label htmlFor="password" required>{t.auth.newPassword}</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" icon="key" required />
          <FieldError>{errorText(t, state.errors?.password)}</FieldError>
        </div>
        <div>
          <Label htmlFor="confirm" required>{t.auth.passwordAgain}</Label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" icon="key" required />
          <FieldError>{errorText(t, state.errors?.confirm)}</FieldError>
        </div>
        <Button type="submit" size="lg" full loading={pending}>
          {t.auth.updatePassword}
        </Button>
      </form>
    </AuthShell>
  );
}
