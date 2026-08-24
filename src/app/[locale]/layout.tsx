import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import "../globals.css";
import { dirFor, getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/provider";
import { ToastProvider } from "@/components/ui/Overlay";
import { AuthHashCatcher } from "@/components/auth/AuthHashCatcher";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { getCurrentProfile } from "@/lib/supabase/server";
import { fetchUnreadCounts } from "@/lib/actions/notifications";
import { publicEnv } from "@/lib/env";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#07100d" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  const base = publicEnv.siteUrl.replace(/\/$/, "");

  return {
    metadataBase: new URL(base),
    title: { default: t.meta.title, template: "%s · Voisini" },
    description: t.meta.description,
    applicationName: "Voisini",
    alternates: {
      canonical: `${base}/${locale}`,
      languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}`])),
    },
    openGraph: {
      type: "website",
      siteName: "Voisini",
      title: t.meta.title,
      description: t.meta.description,
      url: `${base}/${locale}`,
      locale,
    },
    twitter: { card: "summary_large_image", title: t.meta.title, description: t.meta.description },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) redirect("/fr");

  const typedLocale = locale as Locale;
  const dictionary = getDictionary(typedLocale);
  const dir = dirFor(typedLocale);
  const profile = await getCurrentProfile();
  const unread = profile
    ? await fetchUnreadCounts()
    : { notifications: 0, messages: 0 };

  return (
    <html lang={typedLocale} dir={dir} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <I18nProvider locale={typedLocale} dictionary={dictionary} dir={dir}>
          <ToastProvider>
            <AuthHashCatcher />
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-200 focus:rounded-full focus:bg-[var(--ink)] focus:px-4 focus:py-2 focus:text-sm focus:text-[var(--surface)]"
            >
              {dictionary.nav.home}
            </a>
            <Navbar
              unread={unread}
              profile={
                profile
                  ? {
                      id: profile.id,
                      displayName: profile.display_name,
                      avatarUrl: profile.avatar_url,
                      role: profile.role,
                      verified: profile.email_verified && (profile.phone_verified || profile.identity_verified),
                    }
                  : null
              }
            />
            <main id="main" className="pb-20 md:pb-0">
              {children}
            </main>
            <Footer />
            <BottomNav authenticated={Boolean(profile)} />
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
