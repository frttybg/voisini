"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Overlay";

export type PlaceResult = { label: string; lat: number; lng: number; city?: string; postcode?: string };

/**
 * Keşif bileşeni: metin + konum. Konum gerçek Geolocation API'siyle
 * alınır; izin verilmezse şehir / posta kodu ile manuel arama yapılır
 * (Nominatim üzerinden sunucu tarafı proxy ile).
 */
export function SearchBar({
  size = "lg",
  defaultQuery = "",
  defaultPlace = "",
  className,
}: {
  size?: "md" | "lg";
  defaultQuery?: string;
  defaultPlace?: string;
  className?: string;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { toast } = useToast();

  const [query, setQuery] = useState(defaultQuery);
  const [place, setPlace] = useState(defaultPlace);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [locating, setLocating] = useState(false);
  const [pending, startTransition] = useTransition();

  async function lookupPlace(value: string) {
    setPlace(value);
    setCoords(null);
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}&lang=${locale}`);
      if (!res.ok) return;
      const data = (await res.json()) as { results: PlaceResult[] };
      setSuggestions(data.results.slice(0, 5));
    } catch {
      setSuggestions([]);
    }
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      toast(t.common.error, "error");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setSuggestions([]);
        try {
          const res = await fetch(
            `/api/geocode?lat=${latitude}&lng=${longitude}&lang=${locale}`,
          );
          if (res.ok) {
            const data = (await res.json()) as { results: PlaceResult[] };
            if (data.results[0]) setPlace(data.results[0].label);
          }
        } catch {
          /* konum adı bulunamazsa koordinat yeterli */
        }
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast(t.hero.locationPlaceholder, "info");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (coords) {
      params.set("lat", coords.lat.toFixed(5));
      params.set("lng", coords.lng.toFixed(5));
    }
    if (place.trim()) params.set("place", place.trim());
    startTransition(() => router.push(`/${locale}/listings?${params.toString()}`));
  }

  const tall = size === "lg";

  return (
    <form
      onSubmit={submit}
      className={cn(
        "relative w-full max-w-3xl",
        "rounded-[var(--radius-xl)] border border-[var(--line)] bg-[color-mix(in_oklab,var(--surface-raised)_88%,transparent)]",
        "shadow-[var(--shadow-card)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex flex-col gap-1 p-2 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2.5 px-3">
          <Icon name="search" size={19} className="shrink-0 text-[var(--ink-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.hero.searchPlaceholder}
            aria-label={t.hero.searchLabel}
            className={cn(
              "w-full bg-transparent font-medium text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)]",
              tall ? "py-3.5 text-[1rem]" : "py-2.5 text-[0.9375rem]",
            )}
          />
        </div>

        <span className="hidden h-8 w-px bg-[var(--line)] sm:block" />

        <div className="relative flex flex-1 items-center gap-2.5 px-3">
          <Icon name="pin" size={19} className="shrink-0 text-[var(--ink-muted)]" />
          <input
            value={place}
            onChange={(e) => lookupPlace(e.target.value)}
            placeholder={t.hero.locationPlaceholder}
            aria-label={t.hero.locationPlaceholder}
            className={cn(
              "w-full bg-transparent font-medium text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)]",
              tall ? "py-3.5 text-[1rem]" : "py-2.5 text-[0.9375rem]",
            )}
          />
          <button
            type="button"
            onClick={useMyLocation}
            title={t.hero.useMyLocation}
            aria-label={t.hero.useMyLocation}
            className="shrink-0 rounded-full p-2 text-[var(--brand-600)] transition-colors hover:bg-[var(--brand-50)]"
          >
            <Icon name={locating ? "loader" : "compass"} size={18} className={locating ? "animate-spin" : ""} />
          </button>

          {suggestions.length ? (
            <ul className="animate-pop absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] shadow-[var(--shadow-lift)]">
              {suggestions.map((s) => (
                <li key={`${s.lat}-${s.lng}-${s.label}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setPlace(s.label);
                      setCoords({ lat: s.lat, lng: s.lng });
                      setSuggestions([]);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-start text-sm text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-sunken)]"
                  >
                    <Icon name="pin" size={15} className="text-[var(--ink-muted)]" />
                    <span className="truncate">{s.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          className={cn(
            "flex items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--brand-600)] font-semibold text-white",
            "transition-all duration-300 [transition-timing-function:var(--ease-spring)] hover:bg-[var(--brand-700)] active:scale-[0.97]",
            tall ? "px-6 py-3.5 text-[0.95rem]" : "px-5 py-2.5 text-sm",
          )}
        >
          <Icon name={pending ? "loader" : "search"} size={17} className={pending ? "animate-spin" : ""} />
          {t.hero.search}
        </button>
      </div>
    </form>
  );
}
