import { NextResponse } from "next/server";
import { publicEnv } from "@/lib/env";
import { getSession } from "@/lib/supabase/session";
import { createRestClient } from "@/lib/supabase/rest";
import { randomId } from "@/lib/utils";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, sniffImageType } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Güvenli görsel yükleme.
 * - Yalnızca oturum açmış kullanıcı
 * - Dosya imzasından (magic bytes) gerçek tür doğrulaması
 * - Boyut sınırı
 * - Yol her zaman <userId>/... (Storage politikası da aynısını zorunlu kılar)
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const bucket = String(form.get("bucket") ?? "listings");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (!["listings", "avatars"].includes(bucket)) {
    return NextResponse.json({ error: "bad_bucket" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const buffer = await file.arrayBuffer();
  const sniffed = sniffImageType(new Uint8Array(buffer.slice(0, 16)));
  if (!sniffed || !ALLOWED_IMAGE_TYPES.includes(sniffed)) {
    return NextResponse.json({ error: "bad_type" }, { status: 415 });
  }

  const ext = sniffed.split("/")[1].replace("jpeg", "jpg");
  const path = `${session.userId}/${Date.now()}-${randomId(8)}.${ext}`;

  const client = createRestClient({
    url: publicEnv.supabaseUrl,
    anonKey: publicEnv.supabaseAnonKey,
    token: session.accessToken,
  });

  const { error } = await client.storage.upload(bucket, path, buffer, sniffed);
  if (error) {
    return NextResponse.json({ error: "upload_failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({
    path,
    url: client.storage.publicUrl(bucket, path),
  });
}
