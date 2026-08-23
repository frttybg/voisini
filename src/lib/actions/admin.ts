"use server";

import { revalidatePath } from "next/cache";
import { userClient } from "@/lib/supabase/server";
import { stripHtml } from "@/lib/validation";
import { fail, succeed, type ActionState } from "./shared";

async function requireAdmin() {
  const { client, userId } = await userClient();
  if (!userId) return null;
  const { data } = await client
    .from<{ role: string }>("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (!data || (data.role !== "admin" && data.role !== "moderator")) return null;
  return { client, userId };
}

export async function resolveReportAction(
  reportId: string,
  status: "actioned" | "dismissed",
  resolution?: string,
): Promise<ActionState> {
  const ctx = await requireAdmin();
  if (!ctx) return fail("forbidden");

  const { error } = await ctx.client
    .from("reports")
    .update({
      status,
      resolved_by: ctx.userId,
      resolved_at: new Date().toISOString(),
      resolution: resolution ? stripHtml(resolution).slice(0, 500) : null,
    })
    .eq("id", reportId);
  if (error) return fail(error.message);

  await ctx.client.rpc("log_admin_action", {
    p_action: `report_${status}`,
    p_target_type: "report",
    p_target_id: reportId,
    p_reason: resolution ?? null,
  });

  revalidatePath("/", "layout");
  return succeed("saved");
}

export async function removeListingAction(
  listingId: string,
  reason: string,
): Promise<ActionState> {
  const ctx = await requireAdmin();
  if (!ctx) return fail("forbidden");

  const { error } = await ctx.client
    .from("listings")
    .update({ status: "removed" })
    .eq("id", listingId);
  if (error) return fail(error.message);

  await ctx.client.rpc("log_admin_action", {
    p_action: "listing_removed",
    p_target_type: "listing",
    p_target_id: listingId,
    p_reason: stripHtml(reason).slice(0, 500),
  });

  revalidatePath("/", "layout");
  return succeed("saved");
}

export async function setUserBanAction(
  targetUserId: string,
  banned: boolean,
  reason?: string,
): Promise<ActionState> {
  const ctx = await requireAdmin();
  if (!ctx) return fail("forbidden");

  const { error } = await ctx.client
    .from("profiles")
    .update({
      is_banned: banned,
      ban_reason: banned ? stripHtml(reason ?? "").slice(0, 300) : null,
      banned_until: null,
    })
    .eq("id", targetUserId);
  if (error) return fail(error.message);

  await ctx.client.rpc("log_admin_action", {
    p_action: banned ? "user_banned" : "user_unbanned",
    p_target_type: "user",
    p_target_id: targetUserId,
    p_reason: reason ?? null,
  });

  revalidatePath("/", "layout");
  return succeed("saved");
}

export async function setVerificationAction(
  targetUserId: string,
  kind: "phone" | "identity" | "trusted",
  value: boolean,
): Promise<ActionState> {
  const ctx = await requireAdmin();
  if (!ctx) return fail("forbidden");

  const column =
    kind === "phone" ? "phone_verified" : kind === "identity" ? "identity_verified" : "is_trusted";

  const { error } = await ctx.client
    .from("profiles")
    .update({ [column]: value })
    .eq("id", targetUserId);
  if (error) return fail(error.message);

  await ctx.client.rpc("log_admin_action", {
    p_action: `verify_${kind}`,
    p_target_type: "user",
    p_target_id: targetUserId,
  });

  revalidatePath("/", "layout");
  return succeed("saved");
}
