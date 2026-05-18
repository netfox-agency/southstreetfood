import type { MetadataRoute } from "next";

/**
 * PWA manifest — servi auto sur /manifest.webmanifest par Next.js.
 *
 * Permet :
 *  - "Ajouter à l'écran d'accueil" sur mobile (PWA installable)
 *  - Apparition dans le Google Play Store si activé via TWA
 *  - Boost SEO mobile (Google considère les PWA comme un signal qualité)
 *  - Standalone display = vibe app native
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "South Street Food — Fast Food Bayonne",
    short_name: "South Street",
    description:
      "Fast food à Bayonne. Burgers, tacos, wraps livrés sur la zone BAB jusqu'à 4h.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#e8416f",
    lang: "fr-FR",
    orientation: "portrait",
    icons: [
      {
        src: "/brand/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["food", "shopping", "lifestyle"],
    shortcuts: [
      {
        name: "Voir le menu",
        short_name: "Menu",
        description: "Voir la carte complète",
        url: "/menu",
      },
      {
        name: "Mon compte",
        short_name: "Compte",
        url: "/account",
      },
    ],
  };
}
