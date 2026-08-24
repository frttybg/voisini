import type { Locale } from "@/lib/i18n";
import { legalFr } from "./fr";
import { legalTr } from "./tr";
import { legalEn } from "./en";
import { LEGAL_SLUGS, LEGAL_UPDATED, type LegalDoc, type LegalSlug } from "./types";

export { LEGAL_SLUGS, LEGAL_UPDATED };
export type { LegalDoc, LegalSlug };
export { PUBLISHER } from "./types";

const PACKS = { fr: legalFr, tr: legalTr, en: legalEn } as const;

/** Metinlerin hazır olduğu diller. Diğerlerinde Fransızca gösterilir. */
export type LegalLocale = keyof typeof PACKS;

export function isLegalLocale(locale: string): locale is LegalLocale {
  return locale === "fr" || locale === "tr" || locale === "en";
}

export function isLegalSlug(value: string): value is LegalSlug {
  return (LEGAL_SLUGS as string[]).includes(value);
}

/**
 * İstenen dildeki belgeyi döndürür. O dilde metin yoksa Fransızca sürüm
 * verilir ve `fallback` true olur; sayfa bunu okuyucuya açıkça yazar.
 * Hukuken geçerli sürüm zaten Fransızcadır.
 */
export function getLegalDoc(
  locale: Locale,
  slug: LegalSlug,
): { doc: LegalDoc; fallback: boolean } {
  if (isLegalLocale(locale)) return { doc: PACKS[locale][slug], fallback: false };
  return { doc: PACKS.fr[slug], fallback: true };
}
