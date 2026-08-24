import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { anonClient, getCurrentProfile, userClient } from "@/lib/supabase/server";
import {
  getFavoriteIds,
  getListingPoints,
  getViewerLocation,
  imageUrl,
  searchListings,
} from "@/lib/data/listings";
import { formatDate, formatDistance, formatPrice } from "@/lib/utils";
import { publicEnv } from "@/lib/env";
import { Icon, categoryIcon } from "@/components/ui/Icon";
import { Avatar, Badge, Rating, TypeBadge } from "@/components/ui/Primitives";
import { ListingActions } from "@/components/listings/ListingActions";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { ListingCard } from "@/components/listings/ListingCard";
import type { Listing, ListingImage, Profile } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/** İki yaklaşık nokta arasındaki kuş uçuşu mesafe (metre). */
function metersBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function loadListing(slug: string) {
  const client = anonClient();
  const { data: listing } = await client
    .from<Listing>("listings")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!listing) return null;

  const [{ data: images }, { data: owner }, { data: category }] = await Promise.all([
    client
      .from<ListingImage[]>("listing_images")
      .select("*")
      .eq("listing_id", listing.id)
      .order("position", { ascending: true }),
    client.from<Profile>("profiles").select("*").eq("id", listing.owner_id).maybeSingle(),
    listing.category_id
      ? client
          .from<{ slug: string }>("categories")
          .select("slug")
          .eq("id", listing.category_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  return { listing, images: images ?? [], owner, categorySlug: category?.slug ?? null };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "fr") as Locale;
  const data = await loadListing(slug);
  if (!data) return { title: "404" };

  const t = getDictionary(locale);
  const { listing, images } = data;
  const base = publicEnv.siteUrl.replace(/\/$/, "");
  const cover = imageUrl(images[0]?.path);
  const price =
    listing.type === "give"
      ? t.listing.free
      : listing.price_cents
        ? formatPrice(listing.price_cents, locale)
        : listing.rent_price_cents
          ? formatPrice(listing.rent_price_cents, locale)
          : t.types[listing.type].short;

  return {
    title: `${listing.title} · ${price}`,
    description: listing.description.slice(0, 160) || t.meta.description,
    alternates: { canonical: `${base}/${locale}/listings/${listing.slug}` },
    openGraph: {
      title: listing.title,
      description: listing.description.slice(0, 200),
      url: `${base}/${locale}/listings/${listing.slug}`,
      images: cover ? [{ url: cover }] : undefined,
      type: "website",
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = (isLocale(raw) ? raw : "fr") as Locale;
  const t = getDictionary(locale);

  const data = await loadListing(slug);
  if (!data) notFound();

  const { listing, images, owner, categorySlug } = data;
  const profile = await getCurrentProfile();
  const isOwner = profile?.id === listing.owner_id;

  // Görüntülenme sayacı (kendi ilanın sayılmaz)
  if (!isOwner) {
    const { client } = await userClient();
    void client.rpc("increment_listing_view", { p_listing_id: listing.id });
  }

  const [{ items: similar }, favorites, viewerLocation, points] = await Promise.all([
    searchListings({ category: categorySlug, limit: 4, sort: "recent" }),
    getFavoriteIds(),
    getViewerLocation(),
    getListingPoints([listing.id]),
  ]);

  // Yaklaşık mesafe — yalnızca kendi konumunu kaydetmiş kullanıcıya gösterilir.
  // İki nokta da bilerek kaydırılmış konumlardır, açık adres hiç kullanılmaz.
  const listingPoint = points[listing.id];
  const distanceLabel =
    viewerLocation && listingPoint
      ? formatDistance(metersBetween(viewerLocation, listingPoint), locale)
      : null;

  // Takas teklifinde kullanıcının kendi ilanlarını seçebilmesi için
  let myListings: { id: string; title: string }[] = [];
  if (profile && !isOwner && listing.type === "swap") {
    const { client } = await userClient();
    const { data } = await client
      .from<{ id: string; title: string }[]>("listings")
      .select("id,title")
      .eq("owner_id", profile.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(30);
    myListings = data ?? [];
  }

  const gallery = images.map((img) => imageUrl(img.path)).filter(Boolean) as string[];
  const cover = gallery[0] ?? null;

  const priceBlock = (() => {
    if (listing.type === "give") return t.listing.free;
    if (listing.type === "rent" && listing.rent_price_cents !== null) {
      return `${formatPrice(listing.rent_price_cents, locale, listing.currency)} / ${
        listing.rent_period ? t.periods[listing.rent_period] : ""
      }`;
    }
    if (listing.type === "sell" && listing.price_cents !== null) {
      return formatPrice(listing.price_cents, locale, listing.currency);
    }
    return t.types[listing.type].short;
  })();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    image: gallery,
    ...(listing.price_cents !== null
      ? {
          offers: {
            "@type": "Offer",
            price: (listing.price_cents / 100).toFixed(2),
            priceCurrency: listing.currency,
            availability:
              listing.status === "active"
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 pb-24 pt-8 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href={`/${locale}/listings`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
      >
        <Icon name="chevronLeft" size={16} />
        {t.nav.discover}
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
        {/* Galeri */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-sunken)]">
            {cover ? (
              <Image
                src={cover}
                alt={listing.title}
                fill
                sizes="(max-width: 1024px) 100vw, 700px"
                className="object-cover"
                priority
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[var(--ink-muted)]">
                <Icon name={categoryIcon[categorySlug ?? "other"] ?? "package"} size={56} strokeWidth={1.2} />
              </span>
            )}
            <span className="absolute start-4 top-4">
              <TypeBadge type={listing.type} label={t.types[listing.type].label} />
            </span>
            {profile ? (
              <span className="absolute end-4 top-4">
                <FavoriteButton
                  listingId={listing.id}
                  initial={favorites.has(listing.id)}
                  size={40}
                />
              </span>
            ) : null}
          </div>

          {gallery.length > 1 ? (
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {gallery.map((src, i) => (
                <div
                  key={src}
                  className="relative h-20 w-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)]"
                >
                  <Image src={src} alt={`${listing.title} ${i + 1}`} fill sizes="96px" className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-4">
            <h1 className="display-sm text-balance text-[var(--ink)]">{listing.title}</h1>

            <div className="flex flex-wrap items-center gap-2">
              {listing.condition ? (
                <Badge tone="neutral">{t.conditions[listing.condition]}</Badge>
              ) : null}
              {listing.is_negotiable ? <Badge tone="brand">{t.listing.negotiable}</Badge> : null}
              {listing.city ? (
                <Badge tone="neutral" icon="pin">
                  {distanceLabel ? `${listing.city} · ${distanceLabel}` : listing.city}
                </Badge>
              ) : null}
              <Badge tone="neutral" icon="eye">
                {listing.view_count} {t.listing.views}
              </Badge>
              <Badge tone="neutral" icon="heart">
                {listing.favorite_count}
              </Badge>
            </div>

            {listing.description ? (
              <p className="whitespace-pre-line text-[0.9375rem] leading-relaxed text-[var(--ink-soft)]">
                {listing.description}
              </p>
            ) : null}

            {listing.type === "swap" && listing.swap_wanted.length ? (
              <div className="rounded-[var(--radius-lg)] border border-[var(--line)] p-4">
                <h2 className="mb-2 text-sm font-bold text-[var(--ink)]">{t.listing.swapWanted}</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.swap_wanted.map((item) => (
                    <Badge key={item} tone="accent">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {listing.type === "lend" && (listing.lend_from || listing.lend_to) ? (
              <div className="flex flex-wrap gap-4 rounded-[var(--radius-lg)] border border-[var(--line)] p-4 text-sm">
                {listing.lend_from ? (
                  <span>
                    <span className="block text-[0.75rem] text-[var(--ink-muted)]">{t.listing.lendFrom}</span>
                    <span className="font-semibold text-[var(--ink)]">{formatDate(listing.lend_from, locale)}</span>
                  </span>
                ) : null}
                {listing.lend_to ? (
                  <span>
                    <span className="block text-[0.75rem] text-[var(--ink-muted)]">{t.listing.lendTo}</span>
                    <span className="font-semibold text-[var(--ink)]">{formatDate(listing.lend_to, locale)}</span>
                  </span>
                ) : null}
                {listing.lend_terms ? (
                  <p className="w-full text-[var(--ink-soft)]">{listing.lend_terms}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Yan panel */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-soft)]">
            <p
              className="display-sm mb-1"
              style={{ color: `var(--type-${listing.type})` }}
            >
              {priceBlock}
            </p>
            {listing.deposit_cents ? (
              <p className="mb-4 inline-flex items-center gap-1.5 text-[0.8125rem] text-[var(--ink-muted)]">
                <Icon name="shield" size={14} />
                {formatPrice(listing.deposit_cents, locale, listing.currency)} {t.listing.deposited}
              </p>
            ) : null}

            <div className="mt-4">
              <ListingActions
                listingId={listing.id}
                type={listing.type}
                isOwner={Boolean(isOwner)}
                authenticated={Boolean(profile)}
                available={listing.status === "active"}
                myListings={myListings}
              />
            </div>

            <p className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--surface-sunken)] p-3 text-[0.75rem] leading-relaxed text-[var(--ink-muted)]">
              <Icon name="shieldCheck" size={14} className="mt-0.5 shrink-0" />
              {t.listing.safety}
            </p>
          </div>

          {owner ? (
            <div className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--surface-raised)] p-5">
              <h2 className="mb-3 text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                {t.listing.aboutSeller}
              </h2>
              <div className="flex items-center gap-3">
                <Avatar
                  src={owner.avatar_url}
                  name={owner.display_name}
                  size={48}
                  verified={owner.email_verified && (owner.phone_verified || owner.identity_verified)}
                />
                <div className="min-w-0">
                  <p className="truncate font-bold text-[var(--ink)]">{owner.display_name}</p>
                  <Rating value={owner.rating_avg} count={owner.rating_count} />
                </div>
              </div>
              <p className="mt-3 text-[0.8125rem] text-[var(--ink-muted)]">
                {t.listing.memberSince} {formatDate(owner.created_at, locale)}
              </p>
              {owner.bio ? (
                <p className="mt-2 line-clamp-3 text-[0.8125rem] text-[var(--ink-soft)]">{owner.bio}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {owner.email_verified ? <Badge tone="brand" size="sm" icon="badgeCheck">e-mail</Badge> : null}
                {owner.phone_verified ? <Badge tone="brand" size="sm" icon="badgeCheck">SMS</Badge> : null}
                {owner.identity_verified ? <Badge tone="brand" size="sm" icon="shieldCheck">ID</Badge> : null}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {similar.filter((s) => s.id !== listing.id).length ? (
        <section className="mt-20">
          <h2 className="display-sm mb-6 text-[var(--ink)]">{t.listing.similar}</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {similar
              .filter((s) => s.id !== listing.id)
              .slice(0, 4)
              .map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  imageUrl={imageUrl(item.image_path)}
                  favorited={favorites.has(item.id)}
                  canFavorite={Boolean(profile)}
                />
              ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
