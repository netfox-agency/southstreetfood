import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, MapPin, Clock, Truck, Sparkles } from "lucide-react";
import { DELIVERY_CITIES, DELIVERY_ZONES } from "@/lib/constants";

/**
 * Pages city-specific pour SEO local.
 *
 * Une page par ville livrée → 12 pages au total (Bayonne, Anglet, Biarritz,
 * Tarnos, Boucau, Ondres, Saint-Martin-de-Seignanx, Bassussarry, Bidart,
 * Saint-André-de-Seignanx, Labenne, Saint-Pierre-d'Irube).
 *
 * Chaque page cible des keywords ultra-précis : "livraison fast food
 * [ville]", "burger [ville] livraison nuit", "tacos [ville] livraison",
 * etc. Le titre, H1, description, content, schema.org sont localisés.
 *
 * Internal linking : chaque page link vers les autres villes en bas
 * (cross-link = signal SEO fort pour le clustering local).
 *
 * Static generation : Next.js pré-render les 12 pages au build, donc
 * elles sont servies depuis le CDN edge avec TTFB minimal = ranking
 * boost (Google adore les pages rapides).
 */

interface CityPageProps {
  params: Promise<{ ville: string }>;
}

function slugifyCity(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['']/g, "")
    .replace(/\s+/g, "-");
}

function findCityBySlug(slug: string) {
  return DELIVERY_CITIES.find((c) => slugifyCity(c.city) === slug);
}

export async function generateStaticParams() {
  return DELIVERY_CITIES.map((c) => ({ ville: slugifyCity(c.city) }));
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { ville } = await params;
  const cityData = findCityBySlug(ville);
  if (!cityData) return {};
  const cityName = cityData.city;
  const feeEur = (cityData.fee / 100).toFixed(2);

  return {
    title: `Livraison fast food ${cityName} · Burgers Tacos Wraps jusqu'à 4h`,
    description: `Livraison fast food à ${cityName} : burgers, tacos, wraps et bowls artisanaux. Livré chez vous en 30-40 min. Frais ${feeEur}€. Ouvert jusqu'à 4h du matin. Commandez en ligne.`,
    keywords: [
      `livraison fast food ${cityName.toLowerCase()}`,
      `fast food ${cityName.toLowerCase()}`,
      `burger ${cityName.toLowerCase()}`,
      `burger livraison ${cityName.toLowerCase()}`,
      `tacos ${cityName.toLowerCase()}`,
      `tacos livraison ${cityName.toLowerCase()}`,
      `wraps ${cityName.toLowerCase()}`,
      `restaurant livraison ${cityName.toLowerCase()}`,
      `fast food ouvert nuit ${cityName.toLowerCase()}`,
      `fast food 4h ${cityName.toLowerCase()}`,
      `livraison burger nuit ${cityName.toLowerCase()}`,
      `livraison repas ${cityName.toLowerCase()}`,
    ],
    alternates: {
      canonical: `/livraison/${slugifyCity(cityName)}`,
    },
    openGraph: {
      title: `Livraison fast food ${cityName} · South Street Food`,
      description: `Burgers, tacos, wraps livrés à ${cityName} jusqu'à 4h. Frais ${feeEur}€.`,
      url: `https://southstreetfood.vercel.app/livraison/${slugifyCity(cityName)}`,
      type: "website",
    },
  };
}

export default async function CityDeliveryPage({ params }: CityPageProps) {
  const { ville } = await params;
  const cityData = findCityBySlug(ville);
  if (!cityData) notFound();

  const cityName = cityData.city;
  const feeEur = (cityData.fee / 100).toFixed(2);
  const minOrderEur = (cityData.minOrder / 100).toFixed(2);

  // Schema.org Service spécifique à cette ville
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Livraison de repas",
    provider: {
      "@type": "Restaurant",
      name: "South Street Food",
      "@id": "https://southstreetfood.vercel.app/#restaurant",
    },
    areaServed: {
      "@type": "City",
      name: cityName,
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: "Pyrénées-Atlantiques",
      },
    },
    offers: {
      "@type": "Offer",
      price: feeEur,
      priceCurrency: "EUR",
      availabilityStarts: "19:00:00",
      availabilityEnds: "04:00:00",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `Menu livraison ${cityName}`,
      url: "https://southstreetfood.vercel.app/menu",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: "https://southstreetfood.vercel.app",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Livraison",
        item: "https://southstreetfood.vercel.app/livraison",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: cityName,
      },
    ],
  };

  // Autres villes pour cross-linking SEO interne
  const otherCities = DELIVERY_CITIES.filter((c) => c.city !== cityName);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="relative min-h-screen bg-[#fafafa] overflow-hidden">
        {/* Halos brand */}
        <div className="absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full bg-[#e8416f]/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-[#e8416f]/8 blur-[120px] pointer-events-none" />

        {/* Breadcrumb */}
        <div className="relative mx-auto max-w-5xl px-5 pt-6">
          <nav aria-label="Fil d'Ariane" className="text-sm text-[#86868b]">
            <Link href="/" className="hover:text-[#1d1d1f]">
              Accueil
            </Link>
            <span className="mx-2">/</span>
            <Link href="/menu" className="hover:text-[#1d1d1f]">
              Livraison
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[#1d1d1f] font-medium">{cityName}</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative mx-auto max-w-5xl px-5 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-[#e8416f]" />
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#e8416f]">
              Livraison {cityName}
            </span>
          </div>
          <h1 className="font-display text-5xl sm:text-7xl text-[#1d1d1f] tracking-tight leading-[0.95] mb-5">
            Fast food
            <br />
            livré à {cityName}.
          </h1>
          <p className="text-base sm:text-lg text-[#86868b] max-w-2xl leading-relaxed">
            Burgers artisanaux, tacos, wraps et bowls livrés à votre porte sur{" "}
            <strong className="text-[#1d1d1f]">{cityName}</strong>. Ouvert
            tous les jours jusqu&apos;à 4h du matin. Préparation 25 min,
            livraison rapide.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-[#0a0a0a] text-white font-semibold text-[15px] shadow-[0_12px_32px_-8px_rgba(232,65,111,0.4)] hover:bg-[#1d1d1f] transition-all"
            >
              Voir la carte
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-white/70 backdrop-blur-2xl border border-white/60 text-[#1d1d1f] font-semibold text-[15px] hover:bg-white transition-all"
            >
              Commander maintenant
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="relative mx-auto max-w-5xl px-5 mt-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/60 p-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)]">
              <Truck className="h-5 w-5 text-[#e8416f] mb-2" />
              <div className="font-display text-2xl text-[#1d1d1f] tabular-nums">
                {feeEur}€
              </div>
              <p className="text-[12px] text-[#86868b] mt-1">
                Frais de livraison à {cityName}
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/60 p-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)]">
              <Clock className="h-5 w-5 text-[#e8416f] mb-2" />
              <div className="font-display text-2xl text-[#1d1d1f]">19:00 — 4:00</div>
              <p className="text-[12px] text-[#86868b] mt-1">
                Tous les jours. Commande jusqu&apos;à 3h30.
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/60 p-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)]">
              <MapPin className="h-5 w-5 text-[#e8416f] mb-2" />
              <div className="font-display text-2xl text-[#1d1d1f] tabular-nums">
                {minOrderEur}€
              </div>
              <p className="text-[12px] text-[#86868b] mt-1">
                Commande minimum {cityName}
              </p>
            </div>
          </div>
        </section>

        {/* Content blocks pour SEO (texte hyper-localisé) */}
        <section className="relative mx-auto max-w-3xl px-5 mt-16 prose prose-neutral">
          <h2 className="font-display text-3xl text-[#1d1d1f] tracking-tight mb-4">
            Le fast food préféré de {cityName}
          </h2>
          <p className="text-[15px] text-[#1d1d1f] leading-relaxed">
            Vous êtes à <strong>{cityName}</strong> et vous cherchez un{" "}
            <strong>fast food de qualité livré chez vous</strong> ? South
            Street Food vous propose une carte complète de burgers, tacos,
            wraps et bowls préparés à la commande avec des produits frais.
            Livraison en <strong>30 à 40 minutes</strong> en moyenne sur tout{" "}
            {cityName} et alentours.
          </p>
          <h3 className="font-display text-2xl text-[#1d1d1f] tracking-tight mt-8 mb-3">
            Notre carte à {cityName}
          </h3>
          <ul className="text-[15px] text-[#1d1d1f] space-y-1 list-disc list-inside">
            <li>
              <strong>Burgers</strong> : Cheese, Le Big Mc, Big Cheese,
              Montagnard, Le 180 (5 à 11€)
            </li>
            <li>
              <strong>Tacos</strong> M / L / XL (9-11€) avec choix de
              viandes : poulet, viande hachée, kebab, cordon bleu
            </li>
            <li>
              <strong>Bowls</strong> M / L / XL pour une version sans
              tortilla
            </li>
            <li>
              <strong>Wraps</strong> poulet, steak, kebab, Roll (8-9€)
            </li>
            <li>
              <strong>Tex-Mex</strong> : tenders, nuggets, chili cheese,
              bouchées camembert
            </li>
            <li>
              <strong>Frites</strong> : nature, cheddar, cheddar bacon
            </li>
            <li>
              <strong>Desserts</strong> : tiramisu, tarte au Daim,
              cheesecake
            </li>
          </ul>
          <h3 className="font-display text-2xl text-[#1d1d1f] tracking-tight mt-8 mb-3">
            Livraison de nuit à {cityName}
          </h3>
          <p className="text-[15px] text-[#1d1d1f] leading-relaxed">
            South Street Food est l&apos;un des rares fast food de la zone
            BAB ouverts <strong>jusqu&apos;à 4h du matin</strong>. Que vous
            sortiez d&apos;une soirée, terminiez tard au travail ou cherchiez
            simplement un dîner gourmand à {cityName}, on livre. Commandez en
            ligne, payez sécurisé via Stripe, suivez votre commande en
            temps réel.
          </p>
          <h3 className="font-display text-2xl text-[#1d1d1f] tracking-tight mt-8 mb-3">
            Programme fidélité
          </h3>
          <p className="text-[15px] text-[#1d1d1f] leading-relaxed">
            1 € dépensé = 1 point. À partir de 50 points, échangez vos
            points contre une boisson offerte, un dessert, un sandwich, un
            menu complet ou un menu + dessert (jusqu&apos;à 200 points pour
            le tier max). Pas d&apos;expiration des points.
          </p>
        </section>

        {/* Cross-link SEO interne — toutes les autres villes */}
        <section className="relative mx-auto max-w-5xl px-5 mt-16 mb-20">
          <h2 className="font-display text-3xl text-[#1d1d1f] tracking-tight mb-2">
            Autres villes livrées
          </h2>
          <p className="text-sm text-[#86868b] mb-6">
            On livre aussi dans toute la zone BAB et alentours.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherCities.map((c) => (
              <Link
                key={c.city}
                href={`/livraison/${slugifyCity(c.city)}`}
                className="rounded-xl bg-white/70 backdrop-blur-2xl border border-white/60 p-3 hover:border-[#e8416f]/30 hover:shadow-[0_8px_24px_-12px_rgba(232,65,111,0.2)] transition-all"
              >
                <div className="text-[14px] font-semibold text-[#1d1d1f]">
                  Livraison {c.city}
                </div>
                <div className="text-[11px] text-[#86868b] mt-0.5 tabular-nums">
                  {(c.fee / 100).toFixed(2)}€ · min {(c.minOrder / 100).toFixed(0)}€
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative mx-auto max-w-3xl px-5 pb-20">
          <div className="rounded-3xl bg-[#0a0a0a] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 sm:justify-between">
            <div>
              <p className="font-display text-2xl">
                Prêt à commander à {cityName} ?
              </p>
              <p className="text-[13px] text-white/60 mt-1">
                Livraison en 30-40 min. Frais {feeEur}€.
              </p>
            </div>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-[#e8416f] text-white font-semibold text-sm hover:bg-[#d13a63] transition-colors whitespace-nowrap"
            >
              Voir le menu
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

// ISR : revalidation 24h. Les pages city sont quasi-statiques.
export const revalidate = 86400;
