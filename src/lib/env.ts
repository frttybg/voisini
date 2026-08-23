/**
 * Ortam değişkenleri — tek merkezden ve doğrulanmış.
 * Hassas anahtarlar asla istemciye sızmaz (NEXT_PUBLIC_ öneki olmayanlar
 * yalnızca sunucu tarafında okunur).
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Eksik ortam değişkeni: ${name}. .env.local dosyanızı kontrol edin (bkz. .env.example).`,
    );
  }
  return value;
}

/**
 * Kopyala-yapıştır sırasında araya karışan boşluk, satır sonu, tırnak ve
 * sondaki eğik çizgiyi temizler. (Sondaki "/" Supabase'de
 * "Invalid path specified in request URL" hatasına yol açar.)
 */
function clean(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, "")
    .replace(/\/+$/, "")
    // Supabase panelindeki "Data API" adresi /rest/v1 ile biter; kod bu
    // eki kendisi ekliyor, iki kez olmasın diye kırpıyoruz.
    .replace(/\/(rest|auth|storage|realtime)\/v1$/, "");
}

export const publicEnv = {
  supabaseUrl: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  siteUrl: clean(process.env.NEXT_PUBLIC_SITE_URL) || "http://localhost:3000",
};

export function requirePublicEnv() {
  return {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", publicEnv.supabaseUrl),
    supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", publicEnv.supabaseAnonKey),
    siteUrl: publicEnv.siteUrl,
  };
}

/** Yalnızca sunucuda çağrılabilir. */
export function serverEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() yalnızca sunucu tarafında kullanılabilir.");
  }
  return {
    ...requirePublicEnv(),
    serviceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    nominatimEmail: process.env.NOMINATIM_EMAIL ?? "",
  };
}

/** Supabase yapılandırılmış mı? (kurulum yapılmadan da ana sayfa açılabilsin diye) */
export const isSupabaseConfigured =
  Boolean(publicEnv.supabaseUrl) && Boolean(publicEnv.supabaseAnonKey);
