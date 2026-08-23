/**
 * Küçük ve bağımlılıksız doğrulama katmanı (zod yerine).
 * Sunucu tarafında HER form için çalıştırılır — istemci doğrulaması
 * yalnızca kullanıcı deneyimi içindir, güvenlik sınırı sunucudadır.
 */

export type FieldErrors = Record<string, string>;

export type Validated<T> =
  | { ok: true; value: T }
  | { ok: false; errors: FieldErrors };

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function isStrongPassword(password: string) {
  return password.length >= 8 && /[A-Za-zÀ-ÿ]/.test(password) && /\d/.test(password);
}

type Rule = {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  number?: boolean;
  int?: boolean;
  oneOf?: readonly string[];
  message?: string;
};

export function validate<T extends Record<string, unknown>>(
  input: Record<string, unknown>,
  rules: Record<string, Rule>,
): Validated<T> {
  const errors: FieldErrors = {};
  const value: Record<string, unknown> = {};

  for (const [key, rule] of Object.entries(rules)) {
    const raw = input[key];
    const str = raw === undefined || raw === null ? "" : String(raw).trim();

    if (rule.required && !str) {
      errors[key] = rule.message ?? "required";
      continue;
    }
    if (!str && !rule.required) {
      value[key] = rule.number ? null : "";
      continue;
    }
    if (rule.email && !EMAIL_RE.test(str)) {
      errors[key] = rule.message ?? "invalidEmail";
      continue;
    }
    if (rule.min !== undefined && !rule.number && str.length < rule.min) {
      errors[key] = rule.message ?? "tooShort";
      continue;
    }
    if (rule.max !== undefined && !rule.number && str.length > rule.max) {
      errors[key] = rule.message ?? "tooLong";
      continue;
    }
    if (rule.pattern && !rule.pattern.test(str)) {
      errors[key] = rule.message ?? "invalid";
      continue;
    }
    if (rule.oneOf && !rule.oneOf.includes(str)) {
      errors[key] = rule.message ?? "invalid";
      continue;
    }
    if (rule.number) {
      const num = Number(str.replace(",", "."));
      if (Number.isNaN(num)) {
        errors[key] = rule.message ?? "invalid";
        continue;
      }
      if (rule.min !== undefined && num < rule.min) {
        errors[key] = rule.message ?? "tooSmall";
        continue;
      }
      if (rule.max !== undefined && num > rule.max) {
        errors[key] = rule.message ?? "tooLarge";
        continue;
      }
      value[key] = rule.int ? Math.round(num) : num;
      continue;
    }
    value[key] = str;
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: value as T };
}

/** Basit XSS savunması: kullanıcı metinlerinde HTML'e izin verilmez. */
export function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, "").replace(/\u0000/g, "").trim();
}

/** Yükleme güvenliği */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGES_PER_LISTING = 8;

/** Dosya imzasından (magic bytes) gerçek tür kontrolü — uzantıya güvenmeyiz. */
export function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  ) return "image/png";
  const ascii = String.fromCharCode(...bytes.slice(0, 12));
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return "image/webp";
  if (ascii.slice(4, 8) === "ftyp" && ascii.slice(8, 12).startsWith("avi")) return "image/avif";
  return null;
}
