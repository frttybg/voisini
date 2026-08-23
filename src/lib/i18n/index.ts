import fr, { type Dictionary } from "./dictionaries/fr";
import tr from "./dictionaries/tr";
import en from "./dictionaries/en";
import de from "./dictionaries/de";
import ar from "./dictionaries/ar";
import es from "./dictionaries/es";
import { defaultLocale, type Locale } from "./config";

const dictionaries: Record<Locale, Dictionary> = { fr, tr, en, de, ar, es };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export type { Dictionary };
export * from "./config";
