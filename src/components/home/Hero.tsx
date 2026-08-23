"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Icon, categoryIcon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "./SearchBar";
import type { ListingType } from "@/lib/supabase/types";

export type HeroCard = {
  title: string;
  priceLabel: string;
  type: ListingType;
  distance: string | null;
  categorySlug: string;
  imageUrl: string | null;
};

/** Kartların hero içindeki yerleşimi ve parallax katsayıları */
const layout = [
  { className: "left-[3%] top-[16%] w-52 sm:w-56", depth: 0.28, delay: 0 },
  { className: "right-[4%] top-[10%] w-48 sm:w-56", depth: 0.5, delay: 120 },
  { className: "left-[8%] bottom-[12%] w-44 sm:w-52", depth: 0.66, delay: 240 },
  { className: "right-[7%] bottom-[16%] w-48 sm:w-56", depth: 0.36, delay: 360 },
  { className: "left-[40%] top-[4%] w-40 sm:w-44", depth: 0.8, delay: 480 },
];

export function Hero({ cards, liveCount }: { cards: HeroCard[]; liveCount: number }) {
  const { t, locale } = useI18n();
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const update = () => {
      frame = 0;
      const scrolled = Math.min(window.scrollY, 900);
      el.style.setProperty("--sy", String(scrolled));
      el.style.setProperty("--px", pointerX.toFixed(3));
      el.style.setProperty("--py", pointerY.toFixed(3));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const onPointer = (e: PointerEvent) => {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (e.clientY / window.innerHeight - 0.5) * 2;
      schedule();
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("pointermove", onPointer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={stage}
      className="grain relative isolate flex min-h-[92svh] flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-24 sm:px-8"
    >
      {/* Arka plan ışıması */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, var(--hero-glow-a), transparent 70%)," +
            "radial-gradient(50% 40% at 85% 85%, var(--hero-glow-b), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(var(--line-soft) 1px, transparent 1px), linear-gradient(90deg, var(--line-soft) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(70% 60% at 50% 40%, #000 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(70% 60% at 50% 40%, #000 40%, transparent 100%)",
        }}
      />

      {/* Yüzen ilan kartları — çevrendeki gerçek ağın parçaları */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 hidden lg:block">
        {cards.slice(0, 5).map((card, i) => {
          const spot = layout[i];
          return (
            <div
              key={`${card.title}-${i}`}
              className={cn("absolute animate-float", spot.className)}
              style={{
                animationDelay: `${spot.delay}ms`,
                transform:
                  `translate3d(calc(var(--px, 0) * ${8 + spot.depth * 14}px), ` +
                  `calc(var(--sy, 0) * ${-0.06 * spot.depth}px + var(--py, 0) * ${6 + spot.depth * 10}px), 0)`,
              }}
            >
              <FloatingCard card={card} />
            </div>
          );
        })}
      </div>

      {/* İçerik */}
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center text-center">
        <span className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[color-mix(in_oklab,var(--surface-raised)_75%,transparent)] px-3.5 py-1.5 text-[0.75rem] font-semibold text-[var(--ink-soft)] backdrop-blur-md">
          <span className="relative flex h-2 w-2 text-[var(--brand-500)]">
            <span className="pulse-dot absolute inset-0" />
            <span className="relative h-2 w-2 rounded-full bg-current" />
          </span>
          {liveCount > 0 ? `${liveCount} ${t.hero.liveNow}` : t.hero.eyebrow}
        </span>

        <h1 className="display-xl text-balance text-[var(--ink)]">
          <span className="animate-fade-up block" style={{ animationDelay: "60ms" }}>
            {t.hero.titleLine1}
          </span>
          <span
            className="animate-fade-up block bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-800)] bg-clip-text text-transparent"
            style={{ animationDelay: "140ms" }}
          >
            {t.hero.titleLine2}
          </span>
          <span className="animate-fade-up block" style={{ animationDelay: "220ms" }}>
            {t.hero.titleLine3}
          </span>
        </h1>

        <p
          className="lede animate-fade-up mt-6 max-w-xl text-pretty"
          style={{ animationDelay: "300ms" }}
        >
          {t.hero.subtitle}
        </p>

        <div
          className="animate-fade-up mt-9 flex flex-col gap-3 sm:flex-row"
          style={{ animationDelay: "380ms" }}
        >
          <Button href="#nearby" size="lg" icon="compass" magnetic>
            {t.hero.ctaPrimary}
          </Button>
          <Button href={`/${locale}/new`} size="lg" variant="outline" icon="plus">
            {t.hero.ctaSecondary}
          </Button>
        </div>

        <div className="animate-fade-up mt-12 flex w-full justify-center" style={{ animationDelay: "460ms" }}>
          <SearchBar />
        </div>
      </div>

      <a
        href="#discover"
        aria-hidden
        className="absolute bottom-6 hidden text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)] md:block"
      >
        <Icon name="chevronDown" size={22} className="animate-float" />
      </a>
    </section>
  );
}

function FloatingCard({ card }: { card: HeroCard }) {
  const icon = categoryIcon[card.categorySlug] ?? "package";
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[color-mix(in_oklab,var(--surface-raised)_92%,transparent)] shadow-[var(--shadow-lift)] backdrop-blur-md">
      <div className="relative aspect-[5/3] w-full bg-[var(--surface-sunken)]">
        {card.imageUrl ? (
          <Image src={card.imageUrl} alt="" fill sizes="240px" className="object-cover" />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center text-[var(--ink-muted)]"
            style={{
              background:
                `radial-gradient(120% 100% at 20% 0%, color-mix(in oklab, var(--type-${card.type}) 22%, transparent), transparent 65%), var(--surface-sunken)`,
            }}
          >
            <Icon name={icon} size={26} strokeWidth={1.4} />
          </span>
        )}
        <span
          className="absolute start-2 top-2 rounded-full px-2 py-1 text-[0.625rem] font-bold leading-none text-white"
          style={{ background: `var(--type-${card.type})` }}
        >
          {card.priceLabel}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate text-[0.8125rem] font-bold text-[var(--ink)]">{card.title}</p>
        {card.distance ? (
          <p className="mt-0.5 inline-flex items-center gap-1 text-[0.6875rem] text-[var(--ink-muted)]">
            <Icon name="pin" size={11} />
            {card.distance}
          </p>
        ) : null}
      </div>
    </div>
  );
}
