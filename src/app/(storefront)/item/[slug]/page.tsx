import { getMenuItemBySlug, getMenuSideOptions } from "@/lib/queries/menu";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ItemClient } from "./item-client";
import { MENU_ELIGIBLE_SLUGS } from "@/lib/constants";

export const revalidate = 30; // ISR: refresh data every 30s

/**
 * SEO per-item : title + description dynamiques + Product schema.org.
 * Permet a Google d'afficher des rich snippets (prix, dispo, image) dans
 * les SERP pour des recherches type "cheese burger bayonne".
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getMenuItemBySlug(slug);
  if (!item) return {};
  const price = (item.base_price / 100).toFixed(2);
  return {
    title: `${item.name} — ${price}€ · Fast Food Bayonne`,
    description: item.description
      ? `${item.description} À commander chez South Street Food à Bayonne. Livraison sur Bayonne-Anglet-Biarritz jusqu'à 4h.`
      : `${item.name} à ${price}€ chez South Street Food Bayonne. Commande en ligne, livraison ou click & collect jusqu'à 4h.`,
    alternates: { canonical: `/item/${slug}` },
    openGraph: {
      title: `${item.name} — South Street Food`,
      description: item.description ?? `${item.name} à ${price}€`,
      images: item.image_url ? [{ url: item.image_url }] : undefined,
      url: `https://southstreetfood.vercel.app/item/${slug}`,
      type: "website",
    },
  };
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getMenuItemBySlug(slug);

  if (!item) notFound();

  const isMenuEligible = MENU_ELIGIBLE_SLUGS.includes(slug);
  const menuOptions = isMenuEligible ? await getMenuSideOptions() : null;

  // Product schema pour Google Rich Results — prix + dispo dans les SERP
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description:
      item.description ?? `${item.name} chez South Street Food Bayonne`,
    image: item.image_url ?? undefined,
    brand: { "@type": "Brand", name: "South Street Food" },
    offers: {
      "@type": "Offer",
      url: `https://southstreetfood.vercel.app/item/${slug}`,
      priceCurrency: "EUR",
      price: (item.base_price / 100).toFixed(2),
      availability: item.is_available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Restaurant",
        name: "South Street Food",
      },
    },
    category: item.categories?.name,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ItemClient
        item={item}
        isMenuEligible={isMenuEligible}
        menuOptions={menuOptions}
      />
    </>
  );
}
