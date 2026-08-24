/**
 * Yasal sayfaların ortak yapısı.
 * Metinler dil dosyalarında; burada yalnızca biçim ve yayıncı kimliği var.
 */

export type LegalSection = { h: string; p: string[] };

export type LegalDoc = {
  slug: LegalSlug;
  title: string;
  intro?: string;
  sections: LegalSection[];
};

export type LegalSlug = "mentions" | "terms" | "privacy" | "cookies";

export const LEGAL_SLUGS: LegalSlug[] = ["mentions", "terms", "privacy", "cookies"];

/** Son güncelleme tarihi — metinler değiştikçe elle güncellenir. */
export const LEGAL_UPDATED = "2026-08-24";

/**
 * Yayıncı kimliği. Fransa'da (LCEN md. 6) bir sitenin kimin tarafından
 * yayımlandığı belirtilmek zorundadır. Ticari faaliyet başladığında
 * (yani ödeme alınmaya başlandığında) buraya SIREN/SIRET eklenmelidir.
 */
export const PUBLISHER = {
  name: "Ferit Tayboga",
  /** "particulier" | "micro-entreprise" | "societe" */
  status: "particulier" as const,
  // Alan adı e-postası kurulunca burayı contact@voisini.com yap; sayfalar
  // ve alt menü bu tek değerden besleniyor.
  email: "frttybg@gmail.com",
  country: "France",
  /** Ticari kayıt yapıldığında doldurulacak alanlar */
  siret: "",
  vat: "",
  legalForm: "",
  capital: "",
};

export const HOST = {
  name: "Vercel Inc.",
  address: "340 S Lemon Ave #4133, Walnut, CA 91789, USA",
  site: "vercel.com",
};

export const PROCESSORS = [
  { name: "Supabase Inc.", role: "base de données, authentification, stockage", region: "Union européenne (Francfort)" },
  { name: "Vercel Inc.", role: "hébergement du site", region: "Union européenne (Francfort)" },
  { name: "Resend (Plus Five Five, Inc.)", role: "envoi des e-mails", region: "Union européenne (Irlande)" },
  { name: "OpenStreetMap Foundation", role: "fonds de carte", region: "Royaume-Uni" },
];
