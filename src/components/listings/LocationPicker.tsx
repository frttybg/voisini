"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { Icon } from "@/components/ui/Icon";
import { Input, Label } from "@/components/ui/Field";
import type { PlaceResult } from "@/components/home/SearchBar";

export type PickedLocation = {
  lat: number;
  lng: number;
  label: string;
  city: string;
  postcode: string;
};

/**
 * Konum seçici — tarayıcı konumu veya şehir/posta kodu araması.
 * Seçilen tam koordinat sunucuda bulanıklaştırılır (gizlilik).
 */
export function LocationPicker({
  value,
  onChange,
  label,
  hint,
}: {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation | null) => void;
  label?: string;
  hint?: string;
}) {
  const { t, locale } = useI18n();
  const [term, setTerm] = useState(value?.label ?? "");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [busy, setBusy] = useState(false);

  async function search(next: string) {
    setTerm(next);
    onChange(null);
    if (next.trim().length < 3) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(next)}&lang=${locale}`);
      const data = (await res.json()) as { results: PlaceResult[] };
      setResults(data.results);
    } catch {
      setResults([]);
    }
  }

  function pick(place: PlaceResult) {
    const picked: PickedLocation = {
      lat: place.lat,
      lng: place.lng,
      label: place.label,
      city: place.city ?? place.label,
      postcode: place.postcode ?? "",
    };
    setTerm(place.label);
    setResults([]);
    onChange(picked);
  }

  function locate() {
    if (!("geolocation" in navigator)) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}&lang=${locale}`);
          const data = (await res.json()) as { results: PlaceResult[] };
          const first = data.results[0];
          const picked: PickedLocation = {
            lat: latitude,
            lng: longitude,
            label: first?.label ?? `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
            city: first?.city ?? "",
            postcode: first?.postcode ?? "",
          };
          setTerm(picked.label);
          onChange(picked);
        } catch {
          onChange({
            lat: latitude,
            lng: longitude,
            label: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
            city: "",
            postcode: "",
          });
        }
        setBusy(false);
      },
      () => setBusy(false),
      { timeout: 8000, maximumAge: 300000 },
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {label ? <Label hint={hint}>{label}</Label> : null}

      <div className="relative">
        <Input
          value={term}
          onChange={(e) => search(e.target.value)}
          placeholder={t.hero.locationPlaceholder}
          icon="pin"
          className="pe-12"
        />
        <button
          type="button"
          onClick={locate}
          title={t.hero.useMyLocation}
          aria-label={t.hero.useMyLocation}
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-[var(--brand-600)] transition-colors hover:bg-[var(--brand-50)]"
        >
          <Icon name={busy ? "loader" : "compass"} size={17} className={busy ? "animate-spin" : ""} />
        </button>

        {results.length ? (
          <ul className="animate-pop absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-raised)] shadow-[var(--shadow-lift)]">
            {results.map((r) => (
              <li key={`${r.lat}-${r.lng}-${r.label}`}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-start text-sm text-[var(--ink-soft)] hover:bg-[var(--surface-sunken)]"
                >
                  <Icon name="pin" size={15} className="text-[var(--ink-muted)]" />
                  <span className="truncate">{r.label}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {value ? (
        <p
          className={cn(
            "inline-flex items-center gap-1.5 text-[0.8125rem] text-[var(--brand-700)]",
          )}
        >
          <Icon name="check" size={14} />
          {value.label}
        </p>
      ) : null}
    </div>
  );
}
