"use client";

import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Primitives";
import { ListingCard } from "./ListingCard";
import type { ListingCard as ListingCardData } from "@/lib/supabase/types";

export function FavoritesGrid({
  listings,
  images,
}: {
  listings: ListingCardData[];
  images: Record<string, string | null>;
}) {
  const { t, locale } = useI18n();

  if (!listings.length) {
    return (
      <EmptyState
        icon="heart"
        title={t.common.emptyTitle}
        text={t.sections.discoverText}
        action={
          <Button href={`/${locale}/listings`} icon="compass">
            {t.nav.discover}
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          imageUrl={images[listing.id] ?? null}
          favorited
          canFavorite
        />
      ))}
    </div>
  );
}
