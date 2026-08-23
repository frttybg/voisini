"use server";

import { revalidatePath } from "next/cache";
import { userClient } from "@/lib/supabase/server";
import { fuzzCoordinates, randomId, slugify, toEwkt } from "@/lib/utils";
import { stripHtml } from "@/lib/validation";
import type { ListingType } from "@/lib/supabase/types";
import { fail, rateLimit, succeed, type ActionState } from "./shared";

const TYPES: ListingType[] = ["sell", "give", "lend", "rent", "swap"];
const CONDITIONS = ["new", "like_new", "good", "fair", "for_parts"];
const PERIODS = ["hour", "day", "week", "month"];

function euroToCents(input: FormDataEntryValue | null): number | null {
  if (input === null) return null;
  const raw = String(input).trim().replace(",", ".");
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export async function createListingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");

  if (!(await rateLimit("listing_create", 12, 3600, userId))) return fail("rateLimited");

  const type = String(formData.get("type") ?? "") as ListingType;
  if (!TYPES.includes(type)) return { ok: false, errors: { type: "required" } };

  const title = stripHtml(String(formData.get("title") ?? "")).slice(0, 120);
  const description = stripHtml(String(formData.get("description") ?? "")).slice(0, 5000);
  const categorySlug = String(formData.get("category") ?? "");
  const condition = String(formData.get("condition") ?? "");
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const city = stripHtml(String(formData.get("city") ?? "")).slice(0, 80);
  const postalCode = stripHtml(String(formData.get("postalCode") ?? "")).slice(0, 12);
  const precision = Math.min(Math.max(Number(formData.get("precision") ?? 300), 100), 2000);

  const errors: Record<string, string> = {};
  if (title.length < 3) errors.title = "tooShort";
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) errors.location = "required";
  if (condition && !CONDITIONS.includes(condition)) errors.condition = "invalid";

  const priceCents = euroToCents(formData.get("price"));
  const rentPriceCents = euroToCents(formData.get("rentPrice"));
  const depositCents = euroToCents(formData.get("deposit"));
  const rentPeriod = String(formData.get("rentPeriod") ?? "day");

  if (type === "sell" && priceCents === null) errors.price = "required";
  if (type === "rent") {
    if (rentPriceCents === null) errors.rentPrice = "required";
    if (!PERIODS.includes(rentPeriod)) errors.rentPeriod = "invalid";
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  // Kategori id çözümleme
  let categoryId: string | null = null;
  if (categorySlug) {
    const { data: cat } = await client
      .from<{ id: string }>("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    categoryId = cat?.id ?? null;
  }

  // GİZLİLİK: tam koordinat asla saklanmaz — yalnızca bulanıklaştırılmış nokta
  const fuzzed = fuzzCoordinates(lat, lng, precision);

  const swapWanted = String(formData.get("swapWanted") ?? "")
    .split(",")
    .map((s) => stripHtml(s).trim())
    .filter(Boolean)
    .slice(0, 10);

  const payload: Record<string, unknown> = {
    owner_id: userId,
    slug: `${slugify(title)}-${randomId(6)}`,
    type,
    status: "active",
    title,
    description,
    category_id: categoryId,
    condition: condition || null,
    city: city || null,
    postal_code: postalCode || null,
    geo: toEwkt(fuzzed.lat, fuzzed.lng),
    precision_m: precision,
    price_cents: type === "sell" ? priceCents : null,
    is_negotiable: formData.get("negotiable") === "on",
    rent_price_cents: type === "rent" ? rentPriceCents : null,
    rent_period: type === "rent" ? rentPeriod : null,
    deposit_cents: type === "rent" || type === "lend" ? depositCents : null,
    lend_from: type === "lend" ? (String(formData.get("lendFrom") ?? "") || null) : null,
    lend_to: type === "lend" ? (String(formData.get("lendTo") ?? "") || null) : null,
    lend_terms: type === "lend" ? stripHtml(String(formData.get("lendTerms") ?? "")).slice(0, 1000) : null,
    swap_wanted: type === "swap" ? swapWanted : [],
    published_at: new Date().toISOString(),
  };

  const { data: created, error } = await client
    .from<{ id: string; slug: string }[]>("listings")
    .insert(payload)
    .select("id,slug");

  if (error || !created?.length) return fail(error?.message ?? "error");
  const listing = created[0];

  // Fotoğraflar (önceden /api/upload ile yüklenmiş yollar)
  const paths = formData
    .getAll("images")
    .map((v) => String(v))
    .filter((p) => p.startsWith(`${userId}/`))
    .slice(0, 8);

  if (paths.length) {
    await client.from("listing_images").insert(
      paths.map((path, index) => ({
        listing_id: listing.id,
        path,
        position: index,
        is_primary: index === 0,
      })),
    );
  }

  revalidatePath("/", "layout");
  return succeed("published", { data: { slug: listing.slug } });
}

export async function toggleFavoriteAction(listingId: string): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");

  const { data: existing } = await client
    .from<{ listing_id: string }>("favorites")
    .select("listing_id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existing) {
    await client.from("favorites").delete().eq("user_id", userId).eq("listing_id", listingId);
    return succeed(undefined, { data: { favorited: false } });
  }

  const { error } = await client
    .from("favorites")
    .insert({ user_id: userId, listing_id: listingId });
  if (error) return fail(error.message);
  return succeed(undefined, { data: { favorited: true } });
}

export async function updateListingStatusAction(
  listingId: string,
  status: "active" | "reserved" | "completed" | "archived",
): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");
  const { error } = await client
    .from("listings")
    .update({ status })
    .eq("id", listingId)
    .eq("owner_id", userId);
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return succeed("saved");
}

export async function deleteListingAction(listingId: string): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");
  const { error } = await client
    .from("listings")
    .delete()
    .eq("id", listingId)
    .eq("owner_id", userId);
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return succeed("saved");
}

export async function reportListingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");
  if (!(await rateLimit("report", 10, 86400, userId))) return fail("rateLimited");

  const targetId = String(formData.get("listingId") ?? "");
  const reason = stripHtml(String(formData.get("reason") ?? "")).slice(0, 80);
  const details = stripHtml(String(formData.get("details") ?? "")).slice(0, 1000);
  if (!targetId || !reason) return fail("error");

  const { error } = await client.from("reports").insert({
    reporter_id: userId,
    target: "listing",
    target_id: targetId,
    reason,
    details,
  });
  if (error) return fail(error.message);
  return succeed("saved");
}
