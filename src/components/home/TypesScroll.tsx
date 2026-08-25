"use client";

import { useEffect, useRef, useState } from "react";
import { cn, listingTypeOrder } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { ListingType } from "@/lib/supabase/types";

const typeIcon: Record<ListingType, IconName> = {
  sell: "tag",
  give: "gift",
  lend: "clock",
  rent: "key",
  swap: "swap",
  want: "search",
};

/**
 * Scroll ile anlatım: kullanıcı kaydırdıkça platformun beş kullanım
 * şekli sırayla öne çıkar ve yandaki arayüz her seferinde değişir.
 */
export function TypesScroll() {
  const { t } = useI18n();
  const wrapper = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const p = Math.min(Math.max(-rect.top / total, 0), 0.9999);
      setProgress(p);
      setIndex(Math.floor(p * listingTypeOrder.length));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const active = listingTypeOrder[Math.min(index, listingTypeOrder.length - 1)];

  return (
    <div ref={wrapper} className="relative h-[420vh]" id="share">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-5 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 transition-[background] duration-700"
          style={{
            background: `radial-gradient(60% 50% at 50% 50%, color-mix(in oklab, var(--type-${active}) 14%, transparent), transparent 70%)`,
          }}
        />

        <div className="mx-auto grid w-full max-w-[1240px] items-center gap-12 md:grid-cols-2">
          {/* Sol: dev kelime */}
          <div className="flex flex-col gap-5">
            <span className="eyebrow text-[var(--ink-muted)]">{t.sections.shareTitle}</span>

            <div className="relative h-[clamp(3.5rem,12vw,9rem)]">
              {listingTypeOrder.map((type, i) => (
                <span
                  key={type}
                  aria-hidden={type !== active}
                  className={cn(
                    "display-lg absolute inset-0 flex items-center transition-all duration-500",
                    "[transition-timing-function:var(--ease-spring)]",
                    i === index
                      ? "translate-y-0 opacity-100 blur-0"
                      : i < index
                        ? "-translate-y-8 opacity-0 blur-[3px]"
                        : "translate-y-8 opacity-0 blur-[3px]",
                  )}
                  style={{ color: `var(--type-${type})` }}
                >
                  {t.types[type].label}
                </span>
              ))}
            </div>

            <p className="lede max-w-md text-pretty">{t.types[active].tagline}</p>

            <div className="mt-2 flex flex-wrap gap-2">
              {listingTypeOrder.map((type, i) => (
                <span
                  key={type}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.75rem] font-semibold transition-all duration-400",
                    i === index
                      ? "border-transparent text-white"
                      : "border-[var(--line)] text-[var(--ink-muted)]",
                  )}
                  style={i === index ? { background: `var(--type-${type})` } : undefined}
                >
                  <Icon name={typeIcon[type]} size={13} />
                  {t.types[type].label}
                </span>
              ))}
            </div>

            {/* İlerleme çizgisi */}
            <div className="mt-4 h-1 w-40 overflow-hidden rounded-full bg-[var(--line)]">
              <div
                className="h-full rounded-full transition-[width] duration-200"
                style={{ width: `${progress * 100}%`, background: `var(--type-${active})` }}
              />
            </div>
          </div>

          {/* Sağ: türe göre değişen arayüz */}
          <div className="relative flex items-center justify-center">
            <TypePreview type={active} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TypePreview({ type }: { type: ListingType }) {
  const { t } = useI18n();
  const color = `var(--type-${type})`;

  return (
    <div
      key={type}
      className="animate-pop relative w-full max-w-sm rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-lift)]"
    >
      <div
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[var(--radius-lg)]"
        style={{
          background: `radial-gradient(120% 100% at 20% 0%, color-mix(in oklab, ${color} 26%, transparent), transparent 65%), var(--surface-sunken)`,
        }}
      >
        <Icon name={typeIcon[type]} size={54} strokeWidth={1.2} style={{ color }} />

        {type === "swap" ? (
          <div className="absolute inset-x-6 bottom-5 flex items-center justify-between">
            <span className="h-12 w-12 animate-float rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-raised)] shadow-[var(--shadow-soft)]" />
            <Icon name="swap" size={20} style={{ color }} />
            <span
              className="h-12 w-12 animate-float rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-raised)] shadow-[var(--shadow-soft)]"
              style={{ animationDelay: "700ms" }}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[0.9375rem] font-bold text-[var(--ink)]">
            {t.types[type].short}
          </span>
          <span
            className="rounded-full px-2.5 py-1 text-[0.75rem] font-bold text-white"
            style={{ background: color }}
          >
            {type === "give"
              ? t.listing.free
              : type === "rent"
                ? `12 € / ${t.periods.day}`
                : type === "sell"
                  ? "120 €"
                  : type === "lend"
                    ? "3 j"
                    : "1:1"}
          </span>
        </div>

        {/* Türe özgü alanlar */}
        {type === "rent" ? (
          <Row icon="shield" label={`${t.listing.deposit}: 60 €`} />
        ) : null}
        {type === "lend" ? (
          <Row icon="clock" label={`${t.listing.lendFrom} → ${t.listing.lendTo}`} />
        ) : null}
        {type === "sell" ? <Row icon="euro" label={t.listing.negotiable} /> : null}
        {type === "give" ? <Row icon="gift" label={t.types.give.tagline} /> : null}
        {type === "swap" ? <Row icon="swap" label={t.listing.swapWanted} /> : null}

        <Row icon="pin" label="1.2 km" muted />
      </div>
    </div>
  );
}

function Row({ icon, label, muted }: { icon: IconName; label: string; muted?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[0.8125rem]",
        muted ? "text-[var(--ink-muted)]" : "text-[var(--ink-soft)]",
      )}
    >
      <Icon name={icon} size={14} />
      <span className="truncate">{label}</span>
    </span>
  );
}
