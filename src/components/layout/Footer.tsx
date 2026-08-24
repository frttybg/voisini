"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { PUBLISHER } from "@/lib/legal";

export function Footer() {
  const { t, locale } = useI18n();
  const href = (p: string) => `/${locale}${p}`;
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t.footer.product,
      links: [
        { label: t.nav.discover, href: href("/listings") },
        { label: t.nav.addListing, href: href("/new") },
        { label: t.footer.howItWorks, href: href("/#how") },
      ],
    },
    {
      title: t.footer.company,
      links: [
        { label: t.footer.safety, href: href("/#trust") },
        { label: t.footer.help, href: href("/#how") },
        { label: t.footer.contact, href: `mailto:${PUBLISHER.email}` },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { label: t.footer.mentions, href: href("/legal/mentions") },
        { label: t.footer.terms, href: href("/legal/terms") },
        { label: t.footer.privacy, href: href("/legal/privacy") },
        { label: t.footer.cookies, href: href("/legal/cookies") },
      ],
    },
  ];

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface-sunken)]">
      <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-[var(--ink-muted)]">
            {t.footer.tagline}
          </p>
          <div className="mt-2">
            <LocaleSwitcher />
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <h3 className="text-[0.8125rem] font-bold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
              {col.title}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--ink-soft)] transition-colors hover:text-[var(--brand-600)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--line)]">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center justify-between gap-2 px-5 py-6 text-[0.8125rem] text-[var(--ink-muted)] sm:flex-row sm:px-8">
          <span>© {year} Voisini. {t.footer.rights}</span>
          <span>voisini.com</span>
        </div>
      </div>
    </footer>
  );
}
