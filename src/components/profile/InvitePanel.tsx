"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/** Davet bağlantısı: kopyala, WhatsApp'ta paylaş, kaç kişi geldiğini gör. */
export function InvitePanel({ code, joined }: { code: string; joined: number }) {
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);

  const link = `https://voisini.com/${locale}/register?ref=${code}`;
  const message = `${t.invite.message} ${link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* pano kapalı olabilir */
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-24 pt-10 sm:px-8">
      <h1 className="display-sm mb-2 text-[var(--ink)]">{t.invite.title}</h1>
      <p className="mb-8 max-w-prose text-sm leading-relaxed text-[var(--ink-muted)]">
        {t.invite.text}
      </p>

      <div className="mb-4 flex flex-col gap-2">
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          {t.invite.link}
        </span>
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-sunken)] px-3.5 py-3">
          <Icon name="globe" size={15} className="shrink-0 text-[var(--ink-muted)]" />
          <span dir="ltr" className="min-w-0 flex-1 truncate text-sm text-[var(--ink)]">
            {link}
          </span>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Button onClick={copy} icon={copied ? "check" : "share"} variant="outline">
          {copied ? t.invite.copied : t.invite.copy}
        </Button>
        <Button
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          icon="message"
        >
          {t.invite.share}
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-600)]">
          <Icon name="user" size={18} />
        </span>
        <p className="text-sm text-[var(--ink-soft)]">
          {joined > 0
            ? t.invite.joined.replace("{count}", String(joined))
            : t.invite.none}
        </p>
      </div>
    </div>
  );
}
