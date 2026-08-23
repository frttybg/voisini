"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/supabase/session";
import { userClient } from "@/lib/supabase/server";
import { toEwkt } from "@/lib/utils";
import { stripHtml } from "@/lib/validation";
import { fail, succeed, type ActionState } from "./shared";

export async function saveOnboardingStepAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return fail("forbidden");

  const step = Number(formData.get("step") ?? 0);
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");

  const patch: Record<string, unknown> = { onboarding_step: Math.max(step, 0) };

  if (step >= 1) {
    const displayName = stripHtml(String(formData.get("displayName") ?? "")).slice(0, 60);
    const bio = stripHtml(String(formData.get("bio") ?? "")).slice(0, 400);
    const username = String(formData.get("username") ?? "").trim().toLowerCase();
    if (displayName.length < 2) return { ok: false, errors: { displayName: "tooShort" } };
    patch.display_name = displayName;
    patch.bio = bio;
    if (username) {
      if (!/^[a-z0-9_]{3,24}$/.test(username)) return { ok: false, errors: { username: "invalid" } };
      patch.username = username;
    }
  }

  if (step >= 2) {
    const lat = Number(formData.get("lat"));
    const lng = Number(formData.get("lng"));
    const city = stripHtml(String(formData.get("city") ?? "")).slice(0, 80);
    const postalCode = stripHtml(String(formData.get("postalCode") ?? "")).slice(0, 12);
    const radius = Number(formData.get("radius") ?? 10000);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { ok: false, errors: { location: "required" } };
    }
    patch.city = city || null;
    patch.postal_code = postalCode || null;
    patch.geo = toEwkt(lat, lng);
    patch.search_radius_m = Math.min(Math.max(radius, 1000), 100000);
  }

  if (step >= 3) {
    const interests = formData.getAll("interests").map((v) => String(v).slice(0, 40));
    patch.interests = interests.slice(0, 12);
  }

  if (step >= 4) {
    patch.onboarded_at = new Date().toISOString();
  }

  const { error } = await client.from("profiles").update(patch).eq("id", userId);
  if (error) {
    if (error.code === "23505") return { ok: false, errors: { username: "taken" } };
    return fail(error.message);
  }

  revalidatePath("/", "layout");
  return succeed();
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");

  const patch: Record<string, unknown> = {
    display_name: stripHtml(String(formData.get("displayName") ?? "")).slice(0, 60),
    bio: stripHtml(String(formData.get("bio") ?? "")).slice(0, 400),
    locale: String(formData.get("locale") ?? "fr"),
    show_distance: formData.get("showDistance") === "on",
    allow_messages: formData.get("allowMessages") === "on",
    email_notifications: formData.get("emailNotifications") === "on",
  };

  const avatarUrl = String(formData.get("avatarUrl") ?? "");
  if (avatarUrl) patch.avatar_url = avatarUrl;

  const { error } = await client.from("profiles").update(patch).eq("id", userId);
  if (error) return fail(error.message);

  revalidatePath("/", "layout");
  return succeed("saved");
}

export async function updateSearchLocationAction(
  lat: number,
  lng: number,
  city: string | null,
  radius: number,
): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");
  const { error } = await client
    .from("profiles")
    .update({
      geo: toEwkt(lat, lng),
      city,
      search_radius_m: Math.min(Math.max(radius, 1000), 100000),
    })
    .eq("id", userId);
  if (error) return fail(error.message);
  return succeed();
}
