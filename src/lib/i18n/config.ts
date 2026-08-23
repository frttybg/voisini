export const locales = ["fr", "tr", "en", "de", "ar", "es"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export const localeNames: Record<Locale, string> = {
  fr: "Français",
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  ar: "العربية",
  es: "Español",
};

export const localeFlags: Record<Locale, string> = {
  fr: "🇫🇷",
  tr: "🇹🇷",
  en: "🇬🇧",
  de: "🇩🇪",
  ar: "🇸🇦",
  es: "🇪🇸",
};

export const rtlLocales: Locale[] = ["ar"];

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}

/** Accept-Language başlığından en uygun dili seçer. */
export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const entries = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of entries) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}

/** Kategori adı için dile göre sütun seçimi */
export function categoryNameKey(locale: Locale) {
  return `name_${locale}` as const;
}
