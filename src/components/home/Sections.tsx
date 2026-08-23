"use client";

import { useI18n } from "@/lib/i18n/provider";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeading } from "@/components/ui/Primitives";
import { listingTypeOrder } from "@/lib/utils";

/* ---------------------------------------------------------- Nasıl çalışır */

export function HowItWorks() {
  const { t } = useI18n();
  const steps: { icon: IconName; title: string; text: string }[] = [
    { icon: "search", title: t.how.step1Title, text: t.how.step1Text },
    { icon: "message", title: t.how.step2Title, text: t.how.step2Text },
    { icon: "check", title: t.how.step3Title, text: t.how.step3Text },
    { icon: "gift", title: t.how.step4Title, text: t.how.step4Text },
  ];

  return (
    <Section id="how" className="bg-[var(--surface-sunken)]">
      <SectionHeading eyebrow="06" title={t.sections.howTitle} text={t.sections.howText} />

      <ol className="grid gap-4 md:grid-cols-4">
        {steps.map((step, i) => (
          <Reveal key={step.title} delay={i * 90} variant="scale">
            <li className="relative flex h-full flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-6">
              <span className="absolute end-5 top-5 text-[2.5rem] font-extrabold leading-none text-[var(--line)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-50)] text-[var(--brand-600)]">
                <Icon name={step.icon} size={22} />
              </span>
              <h3 className="text-lg font-bold tracking-[-0.02em] text-[var(--ink)]">{step.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{step.text}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

/* ------------------------------------------------------------------ Güven */

export function Trust() {
  const { t } = useI18n();
  const items: { icon: IconName; title: string; text: string }[] = [
    { icon: "badgeCheck", title: t.trust.verified, text: t.trust.verifiedText },
    { icon: "star", title: t.trust.ratings, text: t.trust.ratingsText },
    { icon: "shieldCheck", title: t.trust.payments, text: t.trust.paymentsText },
    { icon: "flag", title: t.trust.moderation, text: t.trust.moderationText },
  ];

  return (
    <Section id="trust">
      <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <div>
          <SectionHeading eyebrow="07" title={t.sections.trustTitle} text={t.sections.trustText} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 80} variant="right">
              <div className="flex h-full flex-col gap-2.5 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-600)]">
                  <Icon name={item.icon} size={19} />
                </span>
                <h3 className="text-[0.9375rem] font-bold text-[var(--ink)]">{item.title}</h3>
                <p className="text-[0.8125rem] leading-relaxed text-[var(--ink-muted)]">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------- Topluluk */

export function Community({
  stats,
}: {
  stats: { listings: number; members: number; cities: number };
}) {
  const { t } = useI18n();

  const figures = [
    { value: stats.listings, label: t.filters.results },
    { value: stats.members, label: t.sections.communityTitle },
    { value: stats.cities, label: t.filters.distance },
  ];

  return (
    <Section className="relative overflow-hidden bg-[var(--surface-sunken)]">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <SectionHeading
            eyebrow="08"
            title={t.sections.communityTitle}
            text={t.sections.communityText}
          />
          <div className="flex flex-wrap gap-8">
            {figures.map((f) => (
              <div key={f.label} className="flex flex-col">
                <span className="display-sm text-[var(--brand-600)]">
                  {new Intl.NumberFormat().format(f.value)}
                </span>
                <span className="text-[0.8125rem] text-[var(--ink-muted)]">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Beş kullanım şeklinin kayan şeridi */}
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-raised)] py-8">
          <div className="flex w-max animate-marquee gap-4 px-4">
            {[...listingTypeOrder, ...listingTypeOrder, ...listingTypeOrder, ...listingTypeOrder].map(
              (type, i) => (
                <span
                  key={`${type}-${i}`}
                  className="display-sm whitespace-nowrap"
                  style={{ color: `var(--type-${type})` }}
                >
                  {t.types[type].label}
                  <span className="mx-4 text-[var(--line)]">•</span>
                </span>
              ),
            )}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, var(--surface-raised), transparent 12%, transparent 88%, var(--surface-raised))",
            }}
          />
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- Final CTA */

export function FinalCTA() {
  const { t, locale } = useI18n();

  return (
    <Section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70% 60% at 50% 100%, var(--hero-glow-a), transparent 70%)",
        }}
      />
      <Reveal variant="scale">
        <div className="flex flex-col items-center gap-8 rounded-[var(--radius-2xl)] border border-[var(--line)] bg-[var(--surface-raised)] px-6 py-16 text-center shadow-[var(--shadow-card)] sm:px-12 md:py-24">
          <h2 className="display-md max-w-4xl text-balance text-[var(--ink)]">
            {t.sections.finalTitle}
          </h2>
          <p className="lede max-w-lg text-pretty">{t.sections.finalText}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href={`/${locale}/listings`} size="xl" icon="compass" magnetic>
              {t.hero.ctaPrimary}
            </Button>
            <Button href={`/${locale}/new`} size="xl" variant="outline" icon="plus">
              {t.hero.ctaSecondary}
            </Button>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
