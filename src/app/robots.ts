import type { MetadataRoute } from "next";

const BASE_URL = "https://southstreetfood.vercel.app";

/**
 * robots.txt — Next.js le sert automatiquement sur /robots.txt.
 *
 * Strategie :
 *  - Crawl autorise sur tout le site public
 *  - Bloque les zones admin/kitchen/account (privees, pas de SEO value)
 *  - Bloque les APIs (jamais indexer une route /api/*)
 *  - Bloque les confirmations de commande (URL unique par order, donc
 *    pas d'utilite SEO + risque privacy)
 *  - Pointe vers le sitemap pour aider Google a tout decouvrir
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/kitchen/",
          "/account/",
          "/auth/reset-password",
          "/order/confirmation/",
          "/order/track/",
          "/ticket/",
          "/api/",
          "/_next/",
        ],
      },
      // Google et Bing prennent plus de pages — pas besoin de limiter
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/kitchen/", "/account/", "/api/", "/ticket/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
