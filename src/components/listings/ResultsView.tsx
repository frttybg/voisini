"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { ResultsGrid } from "./ResultsGrid";
import { MapView } from "./MapView";
import type { ListingCard as ListingCardData } from "@/lib/supabase/types";

/** Liste ↔ harita geçişi. Seçim adreste tutulur, paylaşılan bağlantı korunur. */
export function ResultsView({
  listings,
  images,
  favorites,
  authenticated,
  total,
  offset,
  points,
}: {
  listings: ListingCardData[];
  images: Record<string, string | null>;
  favorites: string[];
  authenticated: boolean;
  total: number;
  offset: number;
  points: Record<string, { lat: number; lng: number }>;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const isMap = params.get("view") === "map";
  const hasPoints = listings.some((l) => points[l.id]);

  function setView(next: "list" | "map") {
    const query = new URLSearchParams(params.toString());
    if (next === "map") query.set("view", "map");
    else query.delete("view");
    router.replace(`${pathname}${query.size ? `?${query}` : ""}`, { scroll: false });
  }

  const tab = (mode: "list" | "map", icon: "grid" | "map", label: string) => (
    <button
      type="button"
      onClick={() => setView(mode)}
      aria-pressed={mode === "map" ? isMap : !isMap}
      className={cn(
        "flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-[0.8125rem] font-semibold transition-colors",
        (mode === "map") === isMap
          ? "bg-[var(--surface-raised)] text-[var(--ink)] shadow-[var(--shadow-soft)]"
          : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
      )}
    >
      <Icon name={icon} size={15} />
      {label}
    </button>
  );

  return (
    <>
      {listings.length ? (
        <div className="mb-4 inline-flex rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-sunken)] p-1">
          {tab("list", "grid", t.filters.list)}
          {tab("map", "map", t.filters.map)}
        </div>
      ) : null}

      {isMap && listings.length ? (
        hasPoints ? (
          <MapView listings={listings} points={points} images={images} />
        ) : (
          <p className="rounded-[var(--radius-md)] border border-[var(--line)] px-4 py-6 text-center text-sm text-[var(--ink-muted)]">
            {t.filters.noResultsText}
          </p>
        )
      ) : (
        <ResultsGrid
          listings={listings}
          images={images}
          favorites={favorites}
          authenticated={authenticated}
          total={total}
          offset={offset}
        />
      )}
    </>
  );
}
