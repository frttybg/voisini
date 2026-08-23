"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Icon, type IconName } from "@/components/ui/Icon";

export function BottomNav({ authenticated }: { authenticated: boolean }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const href = (p: string) => `/${locale}${p}`;

  const items: { href: string; label: string; icon: IconName; primary?: boolean }[] = [
    { href: href(""), label: t.nav.home, icon: "home" },
    { href: href("/listings"), label: t.nav.discover, icon: "compass" },
    { href: href("/new"), label: t.nav.addListing, icon: "plus", primary: true },
    { href: href("/messages"), label: t.nav.messages, icon: "message" },
    { href: authenticated ? href("/profile") : href("/login"), label: t.nav.profile, icon: "user" },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--surface-raised)_88%,transparent)] backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigation"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {items.map((item) => {
          const active =
            item.href === href("")
              ? pathname === href("") || pathname === `${href("")}/`
              : pathname.startsWith(item.href);

          if (item.primary) {
            return (
              <li key={item.href} className="flex items-center px-1">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-[var(--brand-600)] text-white shadow-[var(--shadow-card)] transition-transform active:scale-95"
                >
                  <Icon name={item.icon} size={22} strokeWidth={2.2} />
                </Link>
              </li>
            );
          }

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[0.6875rem] font-semibold transition-colors",
                  active ? "text-[var(--brand-600)]" : "text-[var(--ink-muted)]",
                )}
              >
                <Icon name={item.icon} size={20} strokeWidth={active ? 2.1 : 1.7} />
                <span className="max-w-16 truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
