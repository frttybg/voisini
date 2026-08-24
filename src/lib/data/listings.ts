import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import { anonClient, userClient } from "@/lib/supabase/server";
import type { Category, ListingCard, ListingType } from "@/lib/supabase/types";

export type SearchParams = {
  lat?: number | null;
  lng?: number | null;
  radius?: number;
  types?: ListingType[] | null;
  category?: string | null;
  query?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  condition?: string | null;
  sort?: "distance" | "recent" | "price_asc" | "price_desc";
  limit?: number;
  offset?: number;
};

export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (!publicEnv.supabaseUrl) return null;
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/listings/${path}`;
}

export async function searchListings(params: SearchParams): Promise<{
  items: ListingCard[];
  total: number;
}> {
  if (!isSupabaseConfigured) return { items: [], total: 0 };

  const { client } = await userClient();
  const { data, error } = await client.rpc<ListingCard[]>("search_listings", {
    p_lat: params.lat ?? null,
    p_lng: params.lng ?? null,
    p_radius_m: params.radius ?? 25000,
    p_types: params.types?.length ? params.types : null,
    p_category: params.category || null,
    p_query: params.query || null,
    p_min_price: params.minPrice ?? null,
    p_max_price: params.maxPrice ?? null,
    p_condition: params.condition || null,
    p_sort: params.sort ?? "distance",
    p_limit: params.limit ?? 24,
    p_offset: params.offset ?? 0,
  });

  if (error || !data) return { items: [], total: 0 };
  return { items: data, total: data[0]?.total_count ?? 0 };
}

/**
 * Oturum açmış kullanıcının kayıtlı (yaklaşık) konumu.
 * Yoksa null döner ve çağıran taraf Paris'e düşer.
 */
export async function getViewerLocation(): Promise<{ lat: number; lng: number } | null> {
  if (!isSupabaseConfigured) return null;
  const { client, userId } = await userClient();
  if (!userId) return null;

  const { data, error } = await client.rpc<{ lat?: unknown; lng?: unknown } | null>(
    "my_location",
  );
  if (error || !data) return null;

  const lat = Number(data.lat);
  const lng = Number(data.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/**
 * Yarıçap merdiveni. Kullanıcının seçtiği çevrede hiç ilan yoksa arama
 * kademeli olarak genişletilir; böylece yeni bir bölgeden gelen ziyaretçi
 * bomboş bir sayfa yerine "biraz daha uzakta" olanları görür.
 */
const RADIUS_LADDER = [50_000, 200_000, 1_000_000, 20_000_000];

export type SearchOutcome = {
  items: ListingCard[];
  total: number;
  /** Sonuçların gerçekten hangi yarıçapla bulunduğu (metre). */
  radius: number;
  /** İstenen yarıçap yetmediği için genişletildi mi? */
  expanded: boolean;
};

export async function searchListingsExpanding(
  params: SearchParams,
): Promise<SearchOutcome> {
  const requested = params.radius ?? 25000;

  const first = await searchListings({ ...params, radius: requested });
  if (first.total > 0) return { ...first, radius: requested, expanded: false };

  // Sayfalama sırasında genişletmeyiz: kullanıcı zaten bir sonuç kümesinde
  // geziyorsa, ikinci sayfada kapsamı değiştirmek kafa karıştırır.
  if ((params.offset ?? 0) > 0) {
    return { ...first, radius: requested, expanded: false };
  }

  for (const radius of RADIUS_LADDER) {
    if (radius <= requested) continue;
    const next = await searchListings({ ...params, radius });
    if (next.total > 0) return { ...next, radius, expanded: true };
  }

  return { ...first, radius: requested, expanded: false };
}

/** Harita işaretleri için ilan koordinatları (yaklaşık konum). */
export async function getListingPoints(
  ids: string[],
): Promise<Record<string, { lat: number; lng: number }>> {
  if (!isSupabaseConfigured || !ids.length) return {};
  const { client } = await userClient();
  const { data, error } = await client.rpc<{ id: string; lat: number; lng: number }[]>(
    "listing_points",
    { p_ids: ids },
  );
  if (error || !data) return {};
  return Object.fromEntries(data.map((row) => [row.id, { lat: row.lat, lng: row.lng }]));
}

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await anonClient()
    .from<Category[]>("categories")
    .select("id,slug,icon,color,sort_order,name_fr,name_tr,name_en,name_de,name_ar,name_es")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getFavoriteIds(): Promise<Set<string>> {
  if (!isSupabaseConfigured) return new Set();
  const { client, userId } = await userClient();
  if (!userId) return new Set();
  const { data } = await client
    .from<{ listing_id: string }[]>("favorites")
    .select("listing_id")
    .eq("user_id", userId)
    .limit(500);
  return new Set((data ?? []).map((row) => row.listing_id));
}

export async function getPlatformStats(): Promise<{
  listings: number;
  members: number;
  cities: number;
}> {
  if (!isSupabaseConfigured) return { listings: 0, members: 0, cities: 0 };
  const client = anonClient();
  const [listings, members] = await Promise.all([
    client.from<{ id: string }[]>("listings").select("id").eq("status", "active").limit(1000),
    client.from<{ id: string }[]>("profiles").select("id").limit(1000),
  ]);
  const { data: cityRows } = await client
    .from<{ city: string | null }[]>("listings")
    .select("city")
    .eq("status", "active")
    .limit(1000);
  const cities = new Set((cityRows ?? []).map((r) => r.city).filter(Boolean));
  return {
    listings: listings.data?.length ?? 0,
    members: members.data?.length ?? 0,
    cities: cities.size,
  };
}

/** Fransa merkezli varsayılan konum (kullanıcı konum vermediğinde) */
export const DEFAULT_LOCATION = { lat: 48.8566, lng: 2.3522, city: "Paris" };

type EmbeddedListing = {
  id: string;
  slug: string;
  title: string;
  type: ListingCard["type"];
  status: ListingCard["status"];
  price_cents: number | null;
  rent_price_cents: number | null;
  rent_period: ListingCard["rent_period"];
  deposit_cents: number | null;
  currency: string;
  condition: ListingCard["condition"];
  city: string | null;
  postal_code: string | null;
  favorite_count: number;
  created_at: string;
  published_at: string | null;
  listing_images: { path: string; is_primary: boolean; position: number }[] | null;
  profiles: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    rating_avg: number;
    rating_count: number;
    email_verified: boolean;
    phone_verified: boolean;
    identity_verified: boolean;
  } | null;
};

const EMBED_SELECT =
  "id,slug,title,type,status,price_cents,rent_price_cents,rent_period,deposit_cents,currency," +
  "condition,city,postal_code,favorite_count,created_at,published_at," +
  "listing_images(path,is_primary,position)," +
  "profiles(id,display_name,avatar_url,rating_avg,rating_count,email_verified,phone_verified,identity_verified)";

function toCard(row: EmbeddedListing): ListingCard {
  const images = [...(row.listing_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position,
  );
  const owner = row.profiles;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    status: row.status,
    price_cents: row.price_cents,
    rent_price_cents: row.rent_price_cents,
    rent_period: row.rent_period,
    deposit_cents: row.deposit_cents,
    currency: row.currency,
    condition: row.condition,
    city: row.city,
    postal_code: row.postal_code,
    distance_m: null,
    favorite_count: row.favorite_count,
    created_at: row.created_at,
    published_at: row.published_at,
    image_path: images[0]?.path ?? null,
    category_slug: null,
    owner_id: owner?.id ?? "",
    owner_name: owner?.display_name ?? "",
    owner_avatar: owner?.avatar_url ?? null,
    owner_rating: owner?.rating_avg ?? 0,
    owner_rating_count: owner?.rating_count ?? 0,
    owner_verified: Boolean(
      owner?.email_verified && (owner?.phone_verified || owner?.identity_verified),
    ),
    total_count: 0,
  };
}

/** Favoriye alınan ilanlar */
export async function getFavoriteListings(): Promise<ListingCard[]> {
  if (!isSupabaseConfigured) return [];
  const { client, userId } = await userClient();
  if (!userId) return [];

  const { data: favs } = await client
    .from<{ listing_id: string }[]>("favorites")
    .select("listing_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  const ids = (favs ?? []).map((f) => f.listing_id);
  if (!ids.length) return [];

  const { data } = await client
    .from<EmbeddedListing[]>("listings")
    .select(EMBED_SELECT)
    .in("id", ids);

  return (data ?? []).map(toCard);
}

/** Bir kullanıcının ilanları */
export async function getUserListings(ownerId: string): Promise<ListingCard[]> {
  if (!isSupabaseConfigured) return [];
  const { client } = await userClient();
  const { data } = await client
    .from<EmbeddedListing[]>("listings")
    .select(EMBED_SELECT)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(60);
  return (data ?? []).map(toCard);
}
