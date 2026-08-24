"use client";

import { useMemo, useState } from "react";
import { cn, listingTypeOrder } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState, Section, SectionHeading } from "@/components/ui/Primitives";
import { ListingCard } from "@/components/listings/ListingCard";
import type { ListingCard as ListingCardData, ListingType } from "@/lib/supabase/types";

export function NearbySection({
  listings,
  images,
  favorites,
  authenticated,
  locationLabel,
  wideArea = false,
}: {
  listings: ListingCardData[];
  images: Record<string, string | null>;
  favorites: string[];
  authenticated: boolean;
  locationLabel: string | null;
  /** Yakında ilan bulunamadığı için arama daha geniş bir alana açıldı. */
  wideArea?: boolean;
}) {
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState<ListingType | "all">("all");
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const filtered = useMemo(
    () => (filter === "all" ? listings : listings.filter((l) => l.type === filter)),
    [listings, filter],
  );

  return (
    <Section id="nearby">
      <SectionHeading
        eyebrow="05"
        title={t.sections.nearbyTitle}
        text={
          wideArea
            ? t.sections.nearbyWideText
            : locationLabel
              ? `${locationLabel} · ${t.sections.nearbyText}`
              : t.sections.nearbyText
        }
        action={
          <Button href={`/${locale}/listings`} variant="outline" size="sm" iconRight="arrowRight">
            {t.common.seeAll}
          </Button>
        }
      />

      <div className="no-scrollbar -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          {t.filters.all}
        </FilterChip>
        {listingTypeOrder.map((type) => (
          <FilterChip
            key={type}
            active={filter === type}
            color={`var(--type-${type})`}
            onClick={() => setFilter(type)}
          >
            {t.types[type].short}
          </FilterChip>
        ))}
      </div>

      {filtered.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {filtered.slice(0, 8).map((listing, i) => (
            <Reveal key={listing.id} delay={i * 60} variant="scale">
              <ListingCard
                listing={listing}
                imageUrl={images[listing.id] ?? null}
                favorited={favoriteSet.has(listing.id)}
                canFavorite={authenticated}
                priority={i < 4}
              />
            </Reveal>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="compass"
          title={t.filters.noResults}
          text={t.filters.noResultsText}
          action={
            <Button href={`/${locale}/new`} icon="plus">
              {t.nav.addListing}
            </Button>
          }
        />
      )}
    </Section>
  );
}

function FilterChip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-[0.8125rem] font-semibold transition-all duration-300",
        "[transition-timing-function:var(--ease-spring)] active:scale-95",
        active
          ? "border-transparent text-white"
          : "border-[var(--line)] bg-[var(--surface-raised)] text-[var(--ink-soft)] hover:border-[var(--brand-300)]",
      )}
      style={active ? { background: color ?? "var(--ink)" } : undefined}
    >
      {children}
    </button>
  );
}
