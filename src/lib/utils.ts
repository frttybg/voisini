import type { Locale } from "@/lib/i18n/config";
import type { ListingType, RentPeriod } from "@/lib/supabase/types";

/** Basit className birleştirici (clsx yerine, bağımlılıksız). */
export function cn(...parts: unknown[]): string {
  return parts.filter((p): p is string => typeof p === "string" && p.length > 0).join(" ");
}

export function formatPrice(cents: number | null | undefined, locale: Locale, currency = "EUR") {
  if (cents === null || cents === undefined) return "";
  return new Intl.NumberFormat(locale === "ar" ? "ar-FR" : locale, {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDistance(meters: number | null | undefined, locale: Locale) {
  if (meters === null || meters === undefined) return null;
  if (meters < 1000) {
    const rounded = Math.max(50, Math.round(meters / 50) * 50);
    return `${rounded} m`;
  }
  const km = meters / 1000;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: km < 10 ? 1 : 0 }).format(km)} km`;
}

export function formatRelativeTime(iso: string | null | undefined, locale: Locale) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = Math.round((then - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds) return rtf.format(Math.round(diff / seconds), unit);
  }
  return rtf.format(Math.round(diff), "second");
}

export function formatDate(iso: string | null | undefined, locale: Locale) {
  if (!iso) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
}

/** Başlıktan URL dostu slug üretir (Türkçe/Fransızca/Arapça karakterler dahil). */
export function slugify(input: string): string {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
    à: "a", â: "a", ä: "a", é: "e", è: "e", ê: "e", ë: "e",
    î: "i", ï: "i", ô: "o", œ: "oe", ù: "u", û: "u", ÿ: "y", ñ: "n",
  };
  const base = input
    .toLowerCase()
    .replace(/[çğıöşüàâäéèêëîïôœùûÿñ]/g, (c) => map[c] ?? c)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "ilan";
}

export function randomId(length = 8): string {
  const alphabet = "abcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

/** Ana sayfadaki anlatı sırası — markanın beş fiili. */
export const listingTypeOrder: ListingType[] = ["sell", "give", "lend", "rent", "swap"];

/**
 * İlan verirken ve süzgeçlerde kullanılan tam liste. "Aranıyor",
 * elinde bir şey olmayanın da ilan verebilmesi için beş fiile eklenir.
 */
export const listingTypeAll: ListingType[] = [...listingTypeOrder, "want"];

export const listingTypeColor: Record<ListingType, string> = {
  sell: "var(--type-sell)",
  give: "var(--type-give)",
  lend: "var(--type-lend)",
  rent: "var(--type-rent)",
  swap: "var(--type-swap)",
  want: "var(--type-want)",
};

export const rentPeriods: RentPeriod[] = ["hour", "day", "week", "month"];

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** İki nokta arası mesafe (metre) — istemci tarafı yaklaşık hesaplama. */
export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Gizlilik: tam konumu ~precision metre yarıçapında rastgele kaydırır.
 * Sunucuda ilan kaydedilirken uygulanır; tam koordinat hiç saklanmaz.
 */
export function fuzzCoordinates(lat: number, lng: number, precisionM = 300) {
  const angle = Math.random() * 2 * Math.PI;
  const dist = Math.sqrt(Math.random()) * precisionM;
  const dLat = (dist * Math.cos(angle)) / 111320;
  const dLng = (dist * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

/** PostGIS geography sütunu için EWKT değeri */
export function toEwkt(lat: number, lng: number) {
  return `SRID=4326;POINT(${lng} ${lat})`;
}
