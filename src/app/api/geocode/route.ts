import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Geocoding proxy (OpenStreetMap Nominatim — ücretsiz).
 * Sunucu tarafından çağrılır ki kullanılım politikasına uygun bir
 * User-Agent gönderilebilsin ve sonuçlar önbelleğe alınabilsin.
 */
const cache = new Map<string, { at: number; body: unknown }>();
const TTL = 1000 * 60 * 60 * 24;

type NominatimPlace = {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
};

function contact() {
  return process.env.NOMINATIM_EMAIL || "contact@voisini.com";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  const lang = url.searchParams.get("lang") ?? "fr";

  if (!q && (!lat || !lng)) {
    return NextResponse.json({ results: [] });
  }

  const key = q ? `q:${lang}:${q.toLowerCase()}` : `r:${lang}:${lat},${lng}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) {
    return NextResponse.json(hit.body);
  }

  const endpoint = q
    ? `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&accept-language=${lang}&countrycodes=fr,be,ch,lu,de,es,it,nl&q=${encodeURIComponent(q)}&email=${encodeURIComponent(contact())}`
    : `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=${lang}&lat=${lat}&lon=${lng}&email=${encodeURIComponent(contact())}`;

  try {
    const res = await fetch(endpoint, {
      headers: { "User-Agent": `Voisini/1.0 (${contact()})` },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({ results: [] });

    const raw = (await res.json()) as NominatimPlace | NominatimPlace[];
    const places = Array.isArray(raw) ? raw : [raw];

    const results = places
      .filter((p) => p && p.lat && p.lon)
      .map((p) => {
        const a = p.address ?? {};
        const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.suburb ?? "";
        const postcode = a.postcode ?? "";
        const label = [city || p.display_name.split(",")[0], postcode].filter(Boolean).join(" ");
        return {
          label: label || p.display_name.split(",").slice(0, 2).join(", "),
          lat: Number(p.lat),
          lng: Number(p.lon),
          city,
          postcode,
        };
      });

    const body = { results };
    cache.set(key, { at: Date.now(), body });
    if (cache.size > 500) cache.delete(cache.keys().next().value as string);

    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ results: [] });
  }
}
