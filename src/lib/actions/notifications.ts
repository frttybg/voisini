"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { userClient } from "@/lib/supabase/server";
import type { NotificationRow, UnreadCounts } from "@/lib/supabase/types";
import { fail, succeed, type ActionState } from "./shared";

export async function fetchNotifications(limit = 40): Promise<NotificationRow[]> {
  if (!isSupabaseConfigured) return [];
  const { client, userId } = await userClient();
  if (!userId) return [];
  const { data } = await client
    .from<NotificationRow[]>("notifications")
    .select("id,user_id,kind,title,body,url,read_at,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchUnreadCounts(): Promise<UnreadCounts> {
  if (!isSupabaseConfigured) return { notifications: 0, messages: 0 };
  const { client, userId } = await userClient();
  if (!userId) return { notifications: 0, messages: 0 };
  const { data } = await client.rpc<UnreadCounts>("unread_counts");
  return data ?? { notifications: 0, messages: 0 };
}

export async function markNotificationsReadAction(ids?: string[]): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");
  const { error } = await client.rpc("mark_notifications_read", {
    p_ids: ids && ids.length ? ids : null,
  });
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return succeed();
}
