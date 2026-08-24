"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Primitives";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { AppearanceMenu } from "./AppearanceMenu";

export type NavProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  verified: boolean;
};

export function Navbar({
  profile,
  unread = { notifications: 0, messages: 0 },
}: {
  profile: NavProfile | null;
  unread?: { notifications: number; messages: number };
}) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  const href = (p: string) => `/${locale}${p}`;

  const links = [
    { href: href("/listings"), label: t.nav.discover, icon: "compass" as const },
    { href: href("/new"), label: t.nav.addListing, icon: "plus" as const },
    ...(profile ? [{ href: href("/deals"), label: t.deal.title, icon: "swap" as const }] : []),
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-500",
        scrolled || !isHome
          ? "glass border-b border-[var(--line-soft)]"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-[1240px] items-center gap-3 px-5 sm:px-8">
        <Link href={href("")} aria-label="Voisini" className="shrink-0">
          <Logo />
        </Link>

        <div className="mx-2 hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                pathname.startsWith(link.href)
                  ? "bg-[var(--surface-sunken)] text-[var(--ink)]"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)]",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="ms-auto flex items-center gap-1.5">
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>
          <AppearanceMenu allowSkins={profile?.role === "admin"} />

          {profile ? (
            <>
              <Link
                href={href("/favorites")}
                aria-label={t.nav.favorites}
                className="hidden rounded-full p-2.5 text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)] sm:block"
              >
                <Icon name="heart" size={19} />
              </Link>
              <IconLink
                href={href("/messages")}
                label={t.nav.messages}
                icon="message"
                count={unread.messages}
              />
              <IconLink
                href={href("/notifications")}
                label={t.notifications.title}
                icon="bell"
                count={unread.notifications}
              />
              <Link
                href={href("/profile")}
                className="ms-1 flex items-center gap-2 rounded-full border border-[var(--line)] py-1 pe-3 ps-1 transition-colors hover:border-[var(--brand-300)]"
              >
                <Avatar
                  src={profile.avatarUrl}
                  name={profile.displayName}
                  size={28}
                  verified={profile.verified}
                />
                <span className="hidden max-w-24 truncate text-[0.8125rem] font-semibold lg:block">
                  {profile.displayName}
                </span>
              </Link>
            </>
          ) : (
            <>
              <Button href={href("/login")} variant="ghost" size="sm" className="hidden sm:inline-flex">
                {t.nav.login}
              </Button>
              <Button href={href("/register")} size="sm" magnetic>
                {t.nav.register}
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t.nav.home}
            aria-expanded={menuOpen}
            className="rounded-full p-2.5 text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-sunken)] md:hidden"
          >
            <Icon name={menuOpen ? "close" : "menu"} size={20} />
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="animate-fade-up border-t border-[var(--line-soft)] bg-[var(--surface-raised)] px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-sm font-semibold text-[var(--ink-soft)] hover:bg-[var(--surface-sunken)]"
              >
                <Icon name={link.icon} size={18} />
                {link.label}
              </Link>
            ))}
            {profile ? (
              <>
                <Link
                  href={href("/favorites")}
                  className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-sm font-semibold text-[var(--ink-soft)] hover:bg-[var(--surface-sunken)]"
                >
                  <Icon name="heart" size={18} />
                  {t.nav.favorites}
                </Link>
                {profile.role === "admin" || profile.role === "moderator" ? (
                  <Link
                    href={href("/admin")}
                    className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-sm font-semibold text-[var(--ink-soft)] hover:bg-[var(--surface-sunken)]"
                  >
                    <Icon name="shield" size={18} />
                    {t.nav.admin}
                  </Link>
                ) : null}
              </>
            ) : (
              <Link
                href={href("/login")}
                className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-sm font-semibold text-[var(--ink-soft)] hover:bg-[var(--surface-sunken)]"
              >
                <Icon name="user" size={18} />
                {t.nav.login}
              </Link>
            )}
            <div className="mt-2 border-t border-[var(--line-soft)] pt-3">
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function IconLink({
  href,
  label,
  icon,
  count,
}: {
  href: string;
  label: string;
  icon: "message" | "bell";
  count: number;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative hidden rounded-full p-2.5 text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)] sm:block"
    >
      <Icon name={icon} size={19} />
      {count > 0 ? (
        <span className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent-500)] px-1 text-[0.5625rem] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
