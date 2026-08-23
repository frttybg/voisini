"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { cn, formatDistance, formatPrice, formatRelativeTime } from "@/lib/utils";
import { Icon, categoryIcon } from "@/components/ui/Icon";
import { Avatar, TypeBadge } from "@/components/ui/Primitives";
import { FavoriteButton } from "./FavoriteButton";
import type { ListingCard as ListingCardData } from "@/lib/supabase/types";

export function ListingCard({
  listing,
  imageUrl,
  favorited,
  canFavorite,
  priority,
  compact,
}: {
  listing: ListingCardData;
  imageUrl: string | null;
  favorited?: boolean;
  canFavorite?: boolean;
  priority?: boolean;
  compact?: boolean;
}) {
  const { t, locale } = useI18n();
  const distance = formatDistance(listing.distance_m, locale);
  const icon = categoryIcon[listing.category_slug ?? "other"] ?? "package";

  const priceLabel = (() => {
    if (listing.type === "give") return t.listing.free;
    if (listing.type === "rent" && listing.rent_price_cents !== null) {
      const period = listing.rent_period ? t.periods[listing.rent_period] : "";
      return `${formatPrice(listing.rent_price_cents, locale, listing.currency)} / ${period}`;
    }
    if (listing.type === "sell" && listing.price_cents !== null) {
      return formatPrice(listing.price_cents, locale, listing.currency);
    }
    if (listing.type === "swap") return t.types.swap.short;
    if (listing.type === "lend") return t.types.lend.short;
    return "";
  })();

  return (
    <article
      className={cn(
        "card-hover media-zoom group relative flex flex-col overflow-hidden",
        "rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)]",
      )}
    >
      <Link href={`/${locale}/listings/${listing.slug}`} className="relative block overflow-hidden">
        <div className={cn("relative w-full overflow-hidden bg-[var(--surface-sunken)]", compact ? "aspect-[4/3]" : "aspect-[4/3]")}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 300px"
              className="object-cover"
              priority={priority}
            />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center text-[var(--ink-muted)]"
              style={{
                background:
                  "radial-gradient(120% 100% at 20% 0%, color-mix(in oklab, var(--brand-200) 55%, transparent), transparent 60%), var(--surface-sunken)",
              }}
            >
              <Icon name={icon} size={34} strokeWidth={1.4} />
            </span>
          )}
        </div>

        <span className="absolute start-3 top-3">
          <TypeBadge type={listing.type} label={t.types[listing.type].short} size="sm" />
        </span>
      </Link>

      {canFavorite ? (
        <div className="absolute end-3 top-3">
          <FavoriteButton listingId={listing.id} initial={Boolean(favorited)} />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-[0.9375rem] font-bold leading-snug tracking-[-0.01em] text-[var(--ink)]">
            <Link href={`/${locale}/listings/${listing.slug}`} className="hover:text-[var(--brand-700)]">
              {listing.title}
            </Link>
          </h3>
        </div>

        <p
          className="text-[1.05rem] font-extrabold tracking-[-0.02em]"
          style={{ color: `var(--type-${listing.type})` }}
        >
          {priceLabel}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-2 text-[0.75rem] text-[var(--ink-muted)]">
          {distance ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="pin" size={13} />
              {distance}
            </span>
          ) : listing.city ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="pin" size={13} />
              {listing.city}
            </span>
          ) : null}
          <span className="ms-auto">{formatRelativeTime(listing.published_at, locale)}</span>
        </div>

        <div className="flex items-center gap-2 border-t border-[var(--line-soft)] pt-3">
          <Avatar
            src={listing.owner_avatar}
            name={listing.owner_name}
            size={24}
            verified={listing.owner_verified}
          />
          <span className="truncate text-[0.75rem] font-medium text-[var(--ink-soft)]">
            {listing.owner_name}
          </span>
          {listing.owner_rating_count > 0 ? (
            <span className="ms-auto inline-flex items-center gap-1 text-[0.75rem] text-[var(--ink-muted)]">
              <Icon name="star" size={11} fill="var(--warning)" strokeWidth={0} className="text-[var(--warning)]" />
              {listing.owner_rating.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
