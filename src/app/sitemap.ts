import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { DELIVERY_CITIES } from "@/lib/constants";

const BASE_URL = "https://southstreetfood.vercel.app";

function slugifyCity(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['']/g, "")
    .replace(/\s+/g, "-");
}

/**
 * Sitemap dynamique : Next.js le sert automatiquement sur /sitemap.xml.
 *
 * Inclut :
 *  - Pages principales (/, /menu, /fidelite, /reservation, etc.)
 *  - Toutes les 12 pages city (livraison/[ville])
 *  - Tous les menu_items dispo (/item/[slug])
 *  - Pages legales
 *
 * Priorités calibrées pour le crawler :
 *  1.0 = home (priorité max)
 *  0.9 = menu, livraison/* (pages SEO-money)
 *  0.7 = fidelite, item/*
 *  0.5 = reservation, account, auth
 *  0.3 = pages legales
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient();

  // Fetch tous les menu_items dispo
  const { data: items } = await admin
    .from("menu_items")
    .select("slug, updated_at, is_available")
    .eq("is_available", true);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/menu`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/fidelite`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/reservation`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/auth/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/auth/signup`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/cgv`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/mentions-legales`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/confidentialite`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Pages city-specific — priorité haute (SEO money pages)
  const cityPages: MetadataRoute.Sitemap = DELIVERY_CITIES.map((c) => ({
    url: `${BASE_URL}/livraison/${slugifyCity(c.city)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Menu items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemPages: MetadataRoute.Sitemap = ((items ?? []) as any[]).map(
    (item) => ({
      url: `${BASE_URL}/item/${item.slug}`,
      lastModified: item.updated_at ? new Date(item.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }),
  );

  return [...staticPages, ...cityPages, ...itemPages];
}
