"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary } from "./dictionaries/fr";
import type { Locale } from "./config";

type I18nValue = { locale: Locale; t: Dictionary; dir: "ltr" | "rtl" };

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  dir,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  dir: "ltr" | "rtl";
  children: ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, t: dictionary, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/** Dile göre yol üretir: href("/listings") -> "/tr/listings" */
export function useHref() {
  const { locale } = useI18n();
  return (path: string) => `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}
