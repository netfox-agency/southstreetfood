import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, MapPin, Clock, Truck, Sparkles } from "lucide-react";
import { DELIVERY_CITIES } from "@/lib/constants";

/**
 * Pages ville × catégorie pour SEO ultra-ciblé.
 *
 * 12 villes × 7 catégories = 84 pages SSG.
 *
 * Une page par combinaison cible des keywords ultra-précis :
 *   /livraison/bayonne/burgers   → "burger livraison bayonne", "burger nuit bayonne"
 *   /livraison/anglet/tacos      → "tacos livraison anglet"
 *   /livraison/biarritz/wraps    → "wrap livraison biarritz"
 *   etc.
 *
 * x8 de surface SEO vs juste /livraison/[ville]. Stratégie "Uber Eats" :
 * multiplier les landing pages hyper-ciblées sur les longues queues.
 *
 * Chaque page :
 *  - title/description/keywords localisés ville + catégorie
 *  - Content unique avec mention de la catégorie + ville
 *  - Schema.org Service (catégorie spécifique) + BreadcrumbList
 *  - Cross-linking vers autres villes (même catégorie) et autres
 *    catégories (même ville) = signal SEO interne dense
 *  - SSG via generateStaticParams → CDN edge → TTFB minimal
 */

const CATEGORIES = [
  {
    slug: "burgers",
    label: "Burgers",
    plural: "burgers",
    description:
      "burgers artisanaux préparés à la commande avec steak haché ou poulet crunchy",
    items: [
      "Cheese (5€)",
      "Le Big Mc (7€)",
      "Big Cheese (8€)",
      "Montagnard burger raclette/bacon (11€)",
      "Le 180g (11€)",
    ],
    keywords: ["burger", "cheeseburger", "big mac", "hamburger"],
  },
  {
    slug: "tacos",
    label: "Tacos",
    plural: "tacos",
    description:
      "tacos style street food, 1 à 3 viandes au choix, frites fondantes et sauce fromagère",
    items: [
      "Tacos M 1 viande (9€)",
      "Tacos L 2 viandes (10€)",
      "Tacos XL 3 viandes (11€)",
    ],
    keywords: ["tacos", "tacos french", "tacos lyonnais"],
  },
  {
    slug: "bowls",
    label: "Bowls",
    plural: "bowls",
    description:
      "bowls généreux sans tortilla, version healthy du tacos avec frites et sauce",
    items: ["Bowl M (9€)", "Bowl L (10€)", "Bowl XL (11€)"],
    keywords: ["bowl", "buddha bowl"],
  },
  {
    slug: "wraps",
    label: "Wraps",
    plural: "wraps",
    description:
      "wraps roulés dans tortilla moelleuse, viande au choix avec crudités et sauce",
    items: [
      "Wrap poulet (8€)",
      "Wrap steak (8€)",
      "Wrap Kebab (8€)",
      "Roll (9€)",
    ],
    keywords: ["wrap", "wrap poulet", "wrap kebab", "roll"],
  },
  {
    slug: "frites",
    label: "Frites",
    plural: "frites",
    description: "frites dorées et croustillantes, nature ou nappées de cheddar et bacon",
    items: [
      "Frites salées (2€)",
      "Frites cheddar (3,50€)",
      "Frites cheddar bacon (4,50€)",
    ],
    keywords: ["frites", "frites cheddar"],
  },
  {
    slug: "tex-mex",
    label: "Tex-Mex",
    plural: "tex-mex à partager",
    description:
      "snacking à partager : tenders, nuggets, chili cheese, bouchées camembert",
    items: [
      "Tenders croustillants x5 (5,50€)",
      "Nuggets croustillants x6 (5,50€)",
      "Chili cheese x6 (5,50€)",
      "Bouchée Camembert x6 (5,50€)",
    ],
    keywords: ["tex mex", "tenders", "nuggets", "chili cheese"],
  },
  {
    slug: "desserts",
    label: "Desserts",
    plural: "desserts",
    description: "desserts gourmands fait maison",
    items: [
      "Tiramisu (3,50€)",
      "Tarte au Daim (3,50€)",
      "Cheesecake (3,50€)",
    ],
    keywords: ["dessert", "tiramisu", "cheesecake"],
  },
] as const;

interface PageProps {
  params: Promise<{ ville: string; categorie: string }>;
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

function findCategoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export async function generateStaticParams() {
  const params: { ville: string; categorie: string }[] = [];
  for (const c of DELIVERY_CITIES) {
    for (const cat of CATEGORIES) {
      params.push({ ville: slugifyCity(c.city), categorie: cat.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { ville, categorie } = await params;
  const city = findCityBySlug(ville);
  const cat = findCategoryBySlug(categorie);
  if (!city || !cat) return {};
  const feeEur = (city.fee / 100).toFixed(2);

  const title = `${cat.label} livraison ${city.city} · Fast Food jusqu'à 4h`;
  const description = `Livraison ${cat.label.toLowerCase()} à ${city.city} : ${cat.description}. Frais ${feeEur}€. Ouvert jusqu'à 4h. Commande en ligne en 1 clic.`;

  return {
    title,
    description,
    keywords: [
      `${cat.slug} ${city.city.toLowerCase()}`,
      `livraison ${cat.slug} ${city.city.toLowerCase()}`,
      `${cat.slug} livraison ${city.city.toLowerCase()}`,
      ...cat.keywords.map((k) => `${k} ${city.city.toLowerCase()}`),
      ...cat.keywords.map((k) => `${k} livraison ${city.city.toLowerCase()}`),
      `fast food ${city.city.toLowerCase()}`,
      `restaurant ${cat.slug} ${city.city.toLowerCase()}`,
    ],
    alternates: {
      canonical: `/livraison/${slugifyCity(city.city)}/${cat.slug}`,
    },
    openGraph: {
      title: `${cat.label} livraison ${city.city}`,
      description: `${cat.label} à ${city.city} livrés jusqu'à 4h. ${feeEur}€ de frais.`,
      url: `https://southstreetfood.vercel.app/livraison/${slugifyCity(city.city)}/${cat.slug}`,
      type: "website",
    },
  };
}

export default async function CategoryCityPage({ params }: PageProps) {
  const { ville, categorie } = await params;
  const city = findCityBySlug(ville);
  const cat = findCategoryBySlug(categorie);
  if (!city || !cat) notFound();

  const cityName = city.city;
  const citySlug = slugifyCity(cityName);
  const feeEur = (city.fee / 100).toFixed(2);
  const minOrderEur = (city.minOrder / 100).toFixed(2);

  // Schema.org : Service + Breadcrumb spécifiques
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: `Livraison ${cat.label.toLowerCase()}`,
    provider: { "@id": "https://southstreetfood.vercel.app/#restaurant" },
    areaServed: { "@type": "City", name: cityName },
    offers: {
      "@type": "Offer",
      price: feeEur,
      priceCurrency: "EUR",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${cat.label} disponibles à ${cityName}`,
      itemListElement: cat.items.map((item, i) => ({
        "@type": "Offer",
        position: i + 1,
        itemOffered: { "@type": "MenuItem", name: item },
      })),
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
        name: `Livraison ${cityName}`,
        item: `https://southstreetfood.vercel.app/livraison/${citySlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: cat.label,
      },
    ],
  };

  // Cross-linking : meme categorie autres villes + meme ville autres categories
  const otherCitiesSameCategory = DELIVERY_CITIES.filter(
    (c) => c.city !== cityName,
  );
  const otherCategoriesSameCity = CATEGORIES.filter((c) => c.slug !== cat.slug);

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
        <div className="absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full bg-[#e8416f]/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-[#e8416f]/8 blur-[120px] pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-5 pt-6">
          <nav aria-label="Fil d'Ariane" className="text-sm text-[#86868b]">
            <Link href="/" className="hover:text-[#1d1d1f]">
              Accueil
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/livraison/${citySlug}`}
              className="hover:text-[#1d1d1f]"
            >
              Livraison {cityName}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[#1d1d1f] font-medium">{cat.label}</span>
          </nav>
        </div>

        <section className="relative mx-auto max-w-5xl px-5 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-[#e8416f]" />
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#e8416f]">
              {cat.label} · Livraison {cityName}
            </span>
          </div>
          <h1 className="font-display text-5xl sm:text-7xl text-[#1d1d1f] tracking-tight leading-[0.95] mb-5">
            {cat.label}
            <br />
            livrés à {cityName}.
          </h1>
          <p className="text-base sm:text-lg text-[#86868b] max-w-2xl leading-relaxed">
            Nos {cat.plural} : {cat.description}. Livraison sur{" "}
            <strong className="text-[#1d1d1f]">{cityName}</strong> en 30-40
            minutes. Ouvert jusqu&apos;à 4h.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-[#0a0a0a] text-white font-semibold text-[15px] shadow-[0_12px_32px_-8px_rgba(232,65,111,0.4)] hover:bg-[#1d1d1f] transition-all"
            >
              Commander
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/livraison/${citySlug}`}
              className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-white/70 backdrop-blur-2xl border border-white/60 text-[#1d1d1f] font-semibold text-[15px] hover:bg-white transition-all"
            >
              Voir tout {cityName}
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
              <p className="text-[12px] text-[#86868b] mt-1">Frais à {cityName}</p>
            </div>
            <div className="rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/60 p-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)]">
              <Clock className="h-5 w-5 text-[#e8416f] mb-2" />
              <div className="font-display text-2xl text-[#1d1d1f]">19:00 — 4:00</div>
              <p className="text-[12px] text-[#86868b] mt-1">Tous les jours</p>
            </div>
            <div className="rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/60 p-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)]">
              <MapPin className="h-5 w-5 text-[#e8416f] mb-2" />
              <div className="font-display text-2xl text-[#1d1d1f] tabular-nums">
                {minOrderEur}€
              </div>
              <p className="text-[12px] text-[#86868b] mt-1">Commande minimum</p>
            </div>
          </div>
        </section>

        {/* Liste des items de la categorie */}
        <section className="relative mx-auto max-w-3xl px-5 mt-16">
          <h2 className="font-display text-3xl text-[#1d1d1f] tracking-tight mb-5">
            Notre carte {cat.label.toLowerCase()} à {cityName}
          </h2>
          <ul className="space-y-2">
            {cat.items.map((item) => (
              <li
                key={item}
                className="px-4 py-3 rounded-xl bg-white/70 backdrop-blur-2xl border border-white/60 text-[#1d1d1f]"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[14px] text-[#86868b] leading-relaxed">
            Tous nos {cat.plural} sont préparés à la commande dans notre
            cuisine à Bayonne, puis livrés à {cityName} dans des emballages
            isothermes pour rester chauds. Programme fidélité : 1€ = 1 point,
            récompenses dès 50 points.
          </p>
        </section>

        {/* Cross-link autres catégories de la même ville */}
        <section className="relative mx-auto max-w-5xl px-5 mt-16">
          <h2 className="font-display text-3xl text-[#1d1d1f] tracking-tight mb-2">
            Aussi livré à {cityName}
          </h2>
          <p className="text-sm text-[#86868b] mb-5">
            Toutes les catégories disponibles à la livraison.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherCategoriesSameCity.map((other) => (
              <Link
                key={other.slug}
                href={`/livraison/${citySlug}/${other.slug}`}
                className="rounded-xl bg-white/70 backdrop-blur-2xl border border-white/60 p-3 hover:border-[#e8416f]/30 hover:shadow-[0_8px_24px_-12px_rgba(232,65,111,0.2)] transition-all"
              >
                <div className="text-[14px] font-semibold text-[#1d1d1f]">
                  {other.label}
                </div>
                <div className="text-[11px] text-[#86868b] mt-0.5">
                  Livraison {cityName}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Cross-link même catégorie autres villes */}
        <section className="relative mx-auto max-w-5xl px-5 mt-16 mb-20">
          <h2 className="font-display text-3xl text-[#1d1d1f] tracking-tight mb-2">
            {cat.label} dans les autres villes
          </h2>
          <p className="text-sm text-[#86868b] mb-5">
            On livre aussi des {cat.plural} sur toute la zone BAB.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherCitiesSameCategory.map((other) => (
              <Link
                key={other.city}
                href={`/livraison/${slugifyCity(other.city)}/${cat.slug}`}
                className="rounded-xl bg-white/70 backdrop-blur-2xl border border-white/60 p-3 hover:border-[#e8416f]/30 hover:shadow-[0_8px_24px_-12px_rgba(232,65,111,0.2)] transition-all"
              >
                <div className="text-[14px] font-semibold text-[#1d1d1f]">
                  {cat.label} {other.city}
                </div>
                <div className="text-[11px] text-[#86868b] mt-0.5 tabular-nums">
                  {(other.fee / 100).toFixed(2)}€
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 86400;
