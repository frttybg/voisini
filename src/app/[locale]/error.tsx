"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/**
 * Beklenmedik bir sunucu hatasında gösterilir. Amaç kullanıcıyı ham
 * hata ekranıyla baş başa bırakmamak: ne olduğunu kendi dilinde söyle,
 * iki çıkış yolu ver.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, locale } = useI18n();

  useEffect(() => {
    console.error("[voisini]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60svh] w-full max-w-md flex-col items-center justify-center gap-5 px-5 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--ink-muted)]">
        <Icon name="alert" size={24} />
      </span>
      <h1 className="display-sm text-[var(--ink)]">{t.errorPage.title}</h1>
      <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{t.errorPage.text}</p>

      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset} icon="loader">
          {t.errorPage.retry}
        </Button>
        <Button href={`/${locale}`} variant="outline">
          {t.errorPage.home}
        </Button>
      </div>

      {error.digest ? (
        <p className="font-mono text-[0.7rem] text-[var(--ink-muted)]">{error.digest}</p>
      ) : null}
    </div>
  );
}
