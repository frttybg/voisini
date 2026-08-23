"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Primitives";
import { Reveal } from "@/components/ui/Reveal";
import { ListingCard } from "./ListingCard";
import type { ListingCard as ListingCardData } from "@/lib/supabase/types";

export function ResultsGrid({
  listings,
  images,
  favorites,
  authenticated,
  total,
  offset,
}: {
  listings: ListingCardData[];
  images: Record<string, string | null>;
  favorites: string[];
  authenticated: boolean;
  total: number;
  offset: number;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const pageSize = 24;
  const hasMore = offset + listings.length < total;

  function goTo(nextOffset: number) {
    const next = new URLSearchParams(params.toString());
    if (nextOffset <= 0) next.delete("offset");
    else next.set("offset", String(nextOffset));
    router.push(`${pathname}?${next.toString()}`);
  }

  if (!listings.length) {
    return (
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
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {listings.map((listing, i) => (
          <Reveal key={listing.id} delay={Math.min(i, 8) * 50} variant="scale">
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

      {total > pageSize ? (
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            icon="chevronLeft"
            disabled={offset <= 0}
            onClick={() => goTo(offset - pageSize)}
          >
            {t.common.back}
          </Button>
          <span className="text-sm text-[var(--ink-muted)]">
            {offset + 1}–{offset + listings.length} / {total}
          </span>
          <Button
            variant="outline"
            iconRight="chevronRight"
            disabled={!hasMore}
            onClick={() => goTo(offset + pageSize)}
          >
            {t.common.next}
          </Button>
        </div>
      ) : null}
    </>
  );
}
