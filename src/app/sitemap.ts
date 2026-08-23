import type { MetadataRoute } from "next";
import { publicEnv, isSupabaseConfigured } from "@/lib/env";
import { anonClient } from "@/lib/supabase/server";
import { locales } from "@/lib/i18n/config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl.replace(/\/$/, "");

  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    { url: `${base}/${locale}`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/${locale}/listings`, changeFrequency: "hourly", priority: 0.9 },
  ]);

  if (!isSupabaseConfigured) return staticEntries;

  const { data } = await anonClient()
    .from<{ slug: string; updated_at: string }[]>("listings")
    .select("slug,updated_at")
    .eq("status", "active")
    .order("published_at", { ascending: false })
    .limit(2000);

  const listingEntries: MetadataRoute.Sitemap = (data ?? []).flatMap((row) =>
    locales.map((locale) => ({
      url: `${base}/${locale}/listings/${row.slug}`,
      lastModified: row.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );

  return [...staticEntries, ...listingEntries];
}
