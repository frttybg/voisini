import { publicEnv, isSupabaseConfigured } from "@/lib/env";
import { createRestClient, type RestClient } from "./rest";
import { getSession } from "./session";
import type { Profile } from "./types";

/** Anonim (giriş yapmamış) istemci — RLS "herkese açık" politikalarıyla sınırlı. */
export function anonClient(): RestClient {
  return createRestClient({
    url: publicEnv.supabaseUrl,
    anonKey: publicEnv.supabaseAnonKey,
  });
}

/** Oturumdaki kullanıcının token'ıyla çalışan istemci — RLS kullanıcıya göre uygulanır. */
export async function userClient(): Promise<{ client: RestClient; userId: string | null }> {
  const session = await getSession();
  return {
    client: createRestClient({
      url: publicEnv.supabaseUrl,
      anonKey: publicEnv.supabaseAnonKey,
      token: session?.accessToken,
    }),
    userId: session?.userId ?? null,
  };
}

/**
 * service_role istemcisi — RLS'i atlar. YALNIZCA sunucu tarafında,
 * yalnızca webhook / arka plan işleri / admin bakım görevleri için.
 */
export function serviceClient(): RestClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY tanımlı değil.");
  if (typeof window !== "undefined") throw new Error("serviceClient yalnızca sunucuda kullanılır.");
  return createRestClient({
    url: publicEnv.supabaseUrl,
    anonKey: key,
    token: key,
    serviceRole: true,
  });
}

/** Geçerli kullanıcının profili (yoksa null). */
export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;
  const { client, userId } = await userClient();
  if (!userId) return null;
  const { data } = await client
    .from<Profile>("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data ?? null;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("not_authenticated");
  return profile;
}
