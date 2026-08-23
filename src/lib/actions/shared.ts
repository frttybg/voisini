import { headers } from "next/headers";
import { anonClient } from "@/lib/supabase/server";

/**
 * Yalnızca SUNUCUDA çalışan yardımcılar.
 *
 * Bu dosya `next/headers` kullandığı için istemci bileşenlerinden
 * içe aktarılamaz. İstemci tarafında `idleState` gibi saf değerler
 * gerektiğinde actions/state.ts kullanılır.
 */
export { idleState, fail, succeed, type ActionState } from "./state";

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Sunucu tarafı hız sınırlama. Veritabanındaki check_rate_limit
 * fonksiyonunu kullanır; başarısız olursa isteği engellemez
 * (kullanılabilirlik > katı sınır).
 */
export async function rateLimit(
  bucket: string,
  max: number,
  windowSeconds: number,
  extraKey?: string,
): Promise<boolean> {
  try {
    const ip = await clientIp();
    const client = anonClient();
    const { data, error } = await client.rpc<boolean>("check_rate_limit", {
      p_key: `${bucket}:${extraKey ?? ip}`,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) return true;
    return data !== false;
  } catch {
    return true;
  }
}
