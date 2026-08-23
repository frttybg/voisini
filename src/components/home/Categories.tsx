"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Icon, categoryIcon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeading } from "@/components/ui/Primitives";

export type CategoryItem = { slug: string; name: string; color: string | null; count?: number };

export function Categories({ categories }: { categories: CategoryItem[] }) {
  const { t, locale } = useI18n();
  const [active, setActive] = useState<string | null>(null);

  const activeColor = categories.find((c) => c.slug === active)?.color ?? "var(--brand-500)";

  return (
    <Section id="categories" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 transition-[background] duration-700"
        style={{
          background: active
            ? `radial-gradient(55% 45% at 50% 30%, color-mix(in oklab, ${activeColor} 13%, transparent), transparent 70%)`
            : "transparent",
        }}
      />

      <SectionHeading
        eyebrow="04"
        title={t.sections.categoriesTitle}
        text={t.sections.categoriesText}
      />

      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        onMouseLeave={() => setActive(null)}
      >
        {categories.map((cat, i) => {
          const color = cat.color ?? "var(--brand-500)";
          const isActive = active === cat.slug;
          return (
            <Reveal key={cat.slug} delay={i * 45} variant="scale">
              <Link
                href={`/${locale}/listings?category=${cat.slug}`}
                onMouseEnter={() => setActive(cat.slug)}
                onFocus={() => setActive(cat.slug)}
                className={cn(
                  "group relative flex h-36 flex-col justify-between overflow-hidden rounded-[var(--radius-lg)] border p-4 sm:h-40",
                  "transition-all duration-500 [transition-timing-function:var(--ease-spring)]",
                  isActive
                    ? "-translate-y-1.5 border-transparent shadow-[var(--shadow-lift)]"
                    : "border-[var(--line)] bg-[var(--surface-raised)]",
                )}
                style={
                  isActive
                    ? { background: `color-mix(in oklab, ${color} 10%, var(--surface-raised))` }
                    : undefined
                }
              >
                <span
                  aria-hidden
                  className="absolute -end-6 -top-6 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
                  style={{ background: color }}
                />
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] transition-transform duration-500 group-hover:scale-110"
                  style={{
                    color,
                    background: `color-mix(in oklab, ${color} 14%, transparent)`,
                  }}
                >
                  <Icon name={categoryIcon[cat.slug] ?? "package"} size={22} />
                </span>

                <span className="relative">
                  <span className="block text-[0.9375rem] font-bold tracking-[-0.01em] text-[var(--ink)]">
                    {cat.name}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-[0.75rem] text-[var(--ink-muted)]">
                    {cat.count !== undefined ? `${cat.count}` : ""}
                    <Icon
                      name="arrowUpRight"
                      size={13}
                      className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    />
                  </span>
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
