import type { MetadataRoute } from "next";

const BASE_URL = "https://southstreetfood.vercel.app";

/**
 * robots.txt — servi automatiquement sur /robots.txt par Next.js.
 *
 * Strategy :
 * 1. Crawler classique (Googlebot, Bingbot) : allow everything except admin/private
 * 2. **AI crawlers EXPLICITEMENT autorises** (GEO — Generative Engine
 *    Optimization). Par defaut certains AI bots respectent une politique
 *    restrictive si pas mentionnes. On veut etre indexes par :
 *    - GPTBot (OpenAI ChatGPT search)
 *    - PerplexityBot (Perplexity)
 *    - Claude-Web / anthropic-ai (Claude)
 *    - Google-Extended (Gemini training)
 *    - Applebot-Extended (Apple Intelligence)
 *    - meta-externalagent (Meta AI)
 *
 *    Resultat : quand un user demande a ChatGPT "fast food bayonne
 *    livraison nuit", on apparait en source citee + lien retour. 30%
 *    du trafic search d'ici 2 ans.
 *
 *    Pointe vers /llms.txt qui est un fichier markdown structure
 *    optimise pour les LLMs (standard 2025 https://llmstxt.org).
 */
export default function robots(): MetadataRoute.Robots {
  const aiBotsAllow = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "PerplexityBot",
    "Perplexity-User",
    "Claude-Web",
    "ClaudeBot",
    "anthropic-ai",
    "Google-Extended",
    "Applebot-Extended",
    "meta-externalagent",
    "Bytespider",
    "Amazonbot",
    "FacebookExternalHit",
  ];

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
      // Googlebot : config plus permissive
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/kitchen/", "/account/", "/api/", "/ticket/"],
      },
      // AI bots : explicit allow (GEO)
      ...aiBotsAllow.map((bot) => ({
        userAgent: bot,
        allow: "/",
        disallow: ["/admin/", "/kitchen/", "/account/", "/api/", "/ticket/"],
      })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
