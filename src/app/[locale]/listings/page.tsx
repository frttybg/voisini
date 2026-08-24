import { Suspense } from "react";
import type { Metadata } from "next";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { getCurrentProfile } from "@/lib/supabase/server";
import {
  DEFAULT_LOCATION,
  getCategories,
  getFavoriteIds,
  imageUrl,
  searchListingsExpanding,
} from "@/lib/data/listings";
import { formatDistance } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Filters } from "@/components/listings/Filters";
import { ResultsGrid } from "@/components/listings/ResultsGrid";
import { SearchBar } from "@/components/home/SearchBar";
import type { ListingType } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getDictionary(isLocale(locale) ? locale : "fr");
  return { title: t.nav.discover, description: t.sections.discoverText };
}

export default async function ListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "fr") as Locale;
  const t = getDictionary(locale);
  const sp = await searchParams;

  const one = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const profile = await getCurrentProfile();

  const lat = Number(one("lat"));
  const lng = Number(one("lng"));
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const type = one("type") as ListingType | undefined;
  const sort = (one("sort") ?? "distance") as "distance" | "recent" | "price_asc" | "price_desc";
  const radius = Number(one("radius") ?? profile?.search_radius_m ?? 25000);
  const offset = Number(one("offset") ?? 0);

  const [{ items, total, radius: usedRadius, expanded }, categories, favorites] = await Promise.all([
    searchListingsExpanding({
      lat: hasCoords ? lat : DEFAULT_LOCATION.lat,
      lng: hasCoords ? lng : DEFAULT_LOCATION.lng,
      radius: Number.isFinite(radius) ? radius : 25000,
      types: type ? [type] : null,
      category: one("category") ?? null,
      query: one("q") ?? null,
      condition: one("condition") ?? null,
      minPrice: one("min") ? Number(one("min")) * 100 : null,
      maxPrice: one("max") ? Number(one("max")) * 100 : null,
      sort,
      limit: 24,
      offset: Number.isFinite(offset) ? offset : 0,
    }),
    getCategories(),
    getFavoriteIds(),
  ]);

  const images = Object.fromEntries(items.map((l) => [l.id, imageUrl(l.image_path)]));

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 pb-24 pt-8 sm:px-8">
      <header className="mb-6 flex flex-col gap-5">
        <h1 className="display-sm text-[var(--ink)]">{t.sections.nearbyTitle}</h1>
        <Suspense>
          <SearchBar
            size="md"
            defaultQuery={one("q") ?? ""}
            defaultPlace={one("place") ?? profile?.city ?? ""}
            className="max-w-full"
          />
        </Suspense>
      </header>

      <Suspense>
        <Filters
          total={total}
          categories={categories.map((c) => ({
            slug: c.slug,
            name: (c[`name_${locale}` as keyof typeof c] as string) ?? c.name_fr,
          }))}
        />
      </Suspense>

      {expanded ? (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--line)] px-4 py-3 text-[0.8125rem] text-[var(--ink-muted)]"
          style={{ background: "color-mix(in oklab, var(--brand-500) 6%, transparent)" }}
        >
          <Icon name="pin" size={15} className="mt-0.5 shrink-0 text-[var(--brand-600)]" />
          <span>
            {t.filters.expanded
              .replace(
                "{from}",
                formatDistance(Number.isFinite(radius) ? radius : 25000, locale) ?? "",
              )
              .replace("{to}", formatDistance(usedRadius, locale) ?? "")}
          </span>
        </div>
      ) : null}

      <ResultsGrid
        listings={items}
        images={images}
        favorites={[...favorites]}
        authenticated={Boolean(profile)}
        total={total}
        offset={Number.isFinite(offset) ? offset : 0}
      />
    </div>
  );
}
