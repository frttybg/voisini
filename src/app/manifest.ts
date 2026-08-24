import type { MetadataRoute } from "next";

/**
 * Telefona "ana ekrana ekle" ile kurulduğunda kullanılan bilgiler.
 * Varsayılan dil Fransızca olduğu için metinler Fransızca.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Voisini — Vends. Donne. Prête. Loue. Échange.",
    short_name: "Voisini",
    description:
      "La place de marché de ton quartier : vendre, donner, prêter, louer ou échanger ce qui dort chez toi.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbfaf7",
    theme_color: "#12a97f",
    categories: ["shopping", "lifestyle", "social"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
