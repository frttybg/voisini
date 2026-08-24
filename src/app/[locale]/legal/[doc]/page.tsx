import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import {
  LEGAL_SLUGS,
  LEGAL_UPDATED,
  getLegalDoc,
  isLegalSlug,
} from "@/lib/legal";
import { Icon } from "@/components/ui/Icon";

export function generateStaticParams() {
  return locales.flatMap((locale) => LEGAL_SLUGS.map((doc) => ({ locale, doc })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}): Promise<Metadata> {
  const { locale, doc } = await params;
  if (!isLocale(locale) || !isLegalSlug(doc)) return {};
  const { doc: content } = getLegalDoc(locale, doc);
  return {
    title: content.title,
    description: content.intro,
    robots: { index: true, follow: true },
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}) {
  const { locale: raw, doc: rawDoc } = await params;
  if (!isLegalSlug(rawDoc)) notFound();

  const locale = (isLocale(raw) ? raw : "fr") as Locale;
  const t = getDictionary(locale);
  const { doc, fallback } = getLegalDoc(locale, rawDoc);

  const updated = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(LEGAL_UPDATED));

  const others = LEGAL_SLUGS.filter((slug) => slug !== rawDoc);
  const label: Record<string, string> = {
    mentions: t.footer.mentions,
    terms: t.footer.terms,
    privacy: t.footer.privacy,
    cookies: t.footer.cookies,
  };

  return (
    <div className="mx-auto w-full max-w-[46rem] px-5 pb-24 pt-10 sm:px-8">
      <Link
        href={`/${locale}`}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-[var(--ink-muted)] transition-colors hover:text-[var(--brand-600)]"
      >
        <Icon name="arrowLeft" size={15} className="rtl:rotate-180" />
        {t.legal.backHome}
      </Link>

      <h1 className="display-sm mb-2 text-[var(--ink)]">{doc.title}</h1>
      <p className="mb-8 text-[0.8125rem] text-[var(--ink-muted)]">
        {t.legal.updated} : {updated}
      </p>

      {fallback ? (
        <p className="mb-8 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-sunken)] px-4 py-3 text-[0.8125rem] text-[var(--ink-soft)]">
          {t.legal.fallbackNotice}
        </p>
      ) : null}

      {doc.intro ? (
        <p className="mb-10 text-[1.02rem] leading-relaxed text-[var(--ink-soft)]">{doc.intro}</p>
      ) : null}

      <div className="flex flex-col gap-9">
        {doc.sections.map((section) => (
          <section key={section.h} className="flex flex-col gap-3">
            <h2 className="text-[1.05rem] font-bold text-[var(--ink)]">{section.h}</h2>
            {section.p.map((paragraph, i) => (
              <p key={i} className="text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      <nav className="mt-14 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--line)] pt-6">
        {others.map((slug) => (
          <Link
            key={slug}
            href={`/${locale}/legal/${slug}`}
            className="text-sm text-[var(--ink-muted)] transition-colors hover:text-[var(--brand-600)]"
          >
            {label[slug]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
