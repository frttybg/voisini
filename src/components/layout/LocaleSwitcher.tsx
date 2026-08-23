"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { localeFlags, localeNames, locales, type Locale } from "@/lib/i18n/config";
import { Icon } from "@/components/ui/Icon";

export function LocaleSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const switchTo = (next: Locale) => {
    const segments = pathname.split("/");
    segments[1] = next;
    document.cookie = `vsi-locale=${next};path=/;max-age=31536000;samesite=lax`;
    setOpen(false);
    router.push(segments.join("/") || `/${next}`);
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.common.language}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)]"
      >
        <Icon name="globe" size={18} />
        <span className="uppercase">{locale}</span>
      </button>

      {open ? (
        <div className="animate-pop absolute end-0 z-50 mt-2 w-44 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-1 shadow-[var(--shadow-lift)]">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => switchTo(l)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-start text-sm transition-colors",
                l === locale
                  ? "bg-[var(--brand-50)] font-semibold text-[var(--brand-700)]"
                  : "text-[var(--ink-soft)] hover:bg-[var(--surface-sunken)]",
              )}
            >
              <span aria-hidden>{localeFlags[l]}</span>
              {localeNames[l]}
              {l === locale ? <Icon name="check" size={14} className="ms-auto" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
