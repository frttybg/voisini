"use server";

import { revalidatePath } from "next/cache";
import { userClient } from "@/lib/supabase/server";
import { stripHtml } from "@/lib/validation";
import type { Message } from "@/lib/supabase/types";
import { fail, rateLimit, succeed, type ActionState } from "./shared";

export async function startConversationAction(listingId: string): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");

  const { data, error } = await client.rpc<string>("start_conversation", {
    p_listing_id: listingId,
  });
  if (error) return fail(error.message);
  return succeed(undefined, { data: { conversationId: data } });
}

export async function sendMessageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { client, userId } = await userClient();
  if (!userId) return fail("forbidden");
  if (!(await rateLimit("message", 60, 300, userId))) return fail("rateLimited");

  const conversationId = String(formData.get("conversationId") ?? "");
  const body = stripHtml(String(formData.get("body") ?? "")).slice(0, 4000);
  if (!conversationId || !body) return fail("error");

  const { error } = await client.rpc<string>("send_message", {
    p_conversation_id: conversationId,
    p_body: body,
  });
  if (error) return fail(error.message);

  revalidatePath("/", "layout");
  return succeed();
}

export async function markConversationReadAction(conversationId: string) {
  const { client, userId } = await userClient();
  if (!userId) return;
  await client.rpc("mark_conversation_read", { p_conversation_id: conversationId });
}

/** Sohbetin mesajlarını getirir (istemci tarafı yoklama için). */
export async function fetchMessagesAction(
  conversationId: string,
  afterIso?: string,
): Promise<Message[]> {
  const { client, userId } = await userClient();
  if (!userId) return [];
  let query = client
    .from<Message[]>("messages")
    .select("id,conversation_id,sender_id,body,read_at,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (afterIso) query = query.gt("created_at", afterIso);
  const { data } = await query;
  return data ?? [];
}
