"use server";

import { revalidatePath } from "next/cache";
import { userClient } from "@/lib/supabase/server";
import { stripHtml } from "@/lib/validation";
import { fail, rateLimit, succeed, type ActionState } from "./shared";

export type SavedSearch = {
  id: string;
  label: string;
  q: string | null;
  types: string[] | null;
  category: string | null;
  condition: string | null;
  min_price: number | null;
  max_price: number | null;
  radius_m: number;
  place: string | null;
  created_at: string;
  lat: number | null;
  lng: number | null;
};

/** Keşfet sayfasındaki mevcut süzgeçleri alarm olarak kaydeder. */
export async function saveSearchAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");
  if (!(await rateLimit("save_search", 20, 3600, userId))) return fail("rateLimited");

  const text = (key: string) => {
    const value = stripHtml(String(formData.get(key) ?? "")).trim();
    return value || null;
  };
  const num = (key: string) => {
    const value = Number(formData.get(key));
    return Number.isFinite(value) ? value : null;
  };

  const { error } = await client.rpc("save_search", {
    p_label: (text("label") ?? text("q") ?? "Voisini").slice(0, 80),
    p_q: text("q"),
    p_type: text("type"),
    p_category: text("category"),
    p_condition: text("condition"),
    p_min: num("min"),
    p_max: num("max"),
    p_radius: num("radius") ?? 25000,
    p_lat: num("lat"),
    p_lng: num("lng"),
    p_place: text("place"),
  });

  if (error) {
    return fail(error.message.includes("too_many_searches") ? "tooMany" : error.message);
  }

  revalidatePath("/", "layout");
  return succeed("saved");
}

export async function deleteSearchAction(id: string): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");

  const { error } = await client.rpc("delete_search", { p_id: id });
  if (error) return fail(error.message);

  revalidatePath("/", "layout");
  return succeed("saved");
}

export async function fetchSavedSearches(): Promise<SavedSearch[]> {
  const { client, userId } = await userClient();
  if (!userId) return [];
  const { data, error } = await client.rpc<SavedSearch[]>("my_searches");
  if (error || !Array.isArray(data)) return [];
  return data;
}
