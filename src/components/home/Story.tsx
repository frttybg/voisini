"use client";

import { useI18n } from "@/lib/i18n/provider";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeading } from "@/components/ui/Primitives";

/** 01 — Yakınını keşfet: harita noktaları ve mesafe hissi */
export function DiscoverIntro({
  samples,
}: {
  samples: { title: string; distance: string; typeLabel: string; type: string; price: string }[];
}) {
  const { t } = useI18n();

  return (
    <Section id="discover" className="relative overflow-hidden">
      <div className="grid gap-12 md:grid-cols-[1fr_1.05fr] md:items-center">
        <div>
          <SectionHeading
            eyebrow="01"
            title={t.sections.discoverTitle}
            text={t.sections.discoverText}
          />
        </div>

        {/* Yakındaki noktalar — radar hissi */}
        <Reveal variant="scale">
          <div className="relative aspect-square w-full max-w-lg overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--line)] bg-[var(--surface-raised)]">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(var(--line-soft) 1px, transparent 1px), linear-gradient(90deg, var(--line-soft) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            {[0.32, 0.56, 0.82].map((scale, i) => (
              <span
                key={scale}
                aria-hidden
                className="absolute left-1/2 top-1/2 rounded-full border border-[var(--brand-200)]"
                style={{
                  width: `${scale * 100}%`,
                  height: `${scale * 100}%`,
                  transform: "translate(-50%, -50%)",
                  opacity: 0.9 - i * 0.22,
                }}
              />
            ))}
            <span className="absolute left-1/2 top-1/2 flex h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-[var(--brand-500)]">
              <span className="pulse-dot absolute inset-0" />
              <span className="relative h-3.5 w-3.5 rounded-full bg-current ring-4 ring-[var(--brand-100)]" />
            </span>

            {samples.slice(0, 4).map((s, i) => {
              const spots = [
                { top: "16%", left: "58%" },
                { top: "62%", left: "22%" },
                { top: "30%", left: "18%" },
                { top: "70%", left: "62%" },
              ];
              return (
                <div
                  key={`${s.title}-${i}`}
                  className="absolute animate-float"
                  style={{ ...spots[i], animationDelay: `${i * 500}ms` }}
                >
                  <div className="w-max max-w-[10.5rem] rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-2 shadow-[var(--shadow-card)]">
                    <p className="flex items-center gap-1 text-[0.6875rem] font-semibold text-[var(--brand-600)]">
                      <Icon name="pin" size={11} />
                      {s.distance}
                    </p>
                    <p className="mt-0.5 truncate text-[0.8125rem] font-bold text-[var(--ink)]">
                      {s.title}
                    </p>
                    <p
                      className="text-[0.6875rem] font-semibold"
                      style={{ color: `var(--type-${s.type})` }}
                    >
                      {s.typeLabel} · {s.price}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/** 03 — Yakınındaki insanlarla tanış */
export function MeetSection({
  people,
}: {
  people: { name: string; distance: string; rating: number; avatar: string | null }[];
}) {
  const { t } = useI18n();

  return (
    <Section className="relative overflow-hidden bg-[var(--surface-sunken)]">
      <div className="grid gap-12 md:grid-cols-2 md:items-center">
        <div className="relative min-h-72">
          {people.slice(0, 4).map((p, i) => {
            const spots = [
              "left-0 top-0 rotate-[-3deg]",
              "left-24 top-20 rotate-[2deg]",
              "left-4 top-44 rotate-[1.5deg]",
              "left-32 top-60 rotate-[-2deg]",
            ];
            return (
              <Reveal key={p.name} delay={i * 110} variant="left">
                <div
                  className={`absolute ${spots[i]} flex w-60 items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] p-3 shadow-[var(--shadow-card)]`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-100)] text-[0.875rem] font-bold text-[var(--brand-700)]">
                    {p.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[0.875rem] font-bold text-[var(--ink)]">
                      {p.name}
                    </span>
                    <span className="flex items-center gap-2 text-[0.75rem] text-[var(--ink-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <Icon name="pin" size={11} />
                        {p.distance}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Icon
                          name="star"
                          size={11}
                          fill="var(--warning)"
                          strokeWidth={0}
                          className="text-[var(--warning)]"
                        />
                        {p.rating.toFixed(1)}
                      </span>
                    </span>
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div>
          <SectionHeading
            eyebrow="03"
            title={t.sections.meetTitle}
            text={t.sections.meetText}
          />
          <p className="display-sm text-[var(--brand-600)]">{t.sections.meetSubtitle}</p>
        </div>
      </div>
    </Section>
  );
}
