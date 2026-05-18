import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://southstreetfood.vercel.app"),
  title: {
    default: "South Street Food — Fast Food Bayonne, Burgers Tacos Wraps · Livraison jusqu'à 4h",
    template: "%s · South Street Food Bayonne",
  },
  description:
    "Fast food à Bayonne : burgers artisanaux, tacos, wraps, bowls. Livraison rapide sur Bayonne, Anglet, Biarritz, Tarnos, Boucau, Bidart et alentours. Click & collect. Ouvert jusqu'à 4h du matin. Commande en ligne 1 clic.",
  keywords: [
    // Generic high-volume
    "fast food bayonne",
    "fast food anglet",
    "fast food biarritz",
    "restaurant bayonne",
    "burger bayonne",
    "burger anglet",
    "burger biarritz",
    // Menu items
    "tacos bayonne",
    "tacos anglet",
    "tacos biarritz",
    "wraps bayonne",
    "kebab bayonne",
    "bowls bayonne",
    // Long-tail (golden)
    "livraison fast food bayonne",
    "livraison burger bayonne nuit",
    "livraison tacos bayonne",
    "fast food ouvert nuit bayonne",
    "fast food 4h matin bayonne",
    "click and collect bayonne",
    "fast food livraison anglet",
    "fast food livraison biarritz",
    "livraison fast food tarnos",
    "livraison burger boucau",
    "fast food bidart",
    "fast food ondres",
    "street food bayonne",
    "restaurant ouvert tard bayonne",
  ],
  authors: [{ name: "South Street Food" }],
  creator: "South Street Food",
  publisher: "South Street Food",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "South Street Food",
    url: "https://southstreetfood.vercel.app",
    title: "South Street Food — Fast Food Bayonne · Livraison jusqu'à 4h",
    description:
      "Burgers, tacos, wraps artisanaux. Livraison Bayonne-Anglet-Biarritz et environs. Ouvert jusqu'à 4h. Commande en ligne en 1 clic.",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "South Street Food — Fast Food Bayonne",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "South Street Food — Fast Food Bayonne",
    description:
      "Burgers, tacos, wraps. Livraison Bayonne-Anglet-Biarritz jusqu'à 4h du matin.",
    images: ["/brand/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    // À remplir par le client après création Google Search Console
    // google: "VERIFICATION_CODE_HERE",
  },
  category: "restaurant",
};

/**
 * Schema.org JSON-LD pour Google Rich Results.
 *
 * Type Restaurant + LocalBusiness combiné = ce que Google attend pour
 * afficher les rich snippets restaurant (étoiles, horaires, prix, menu)
 * dans les SERP + Knowledge Panel + Maps.
 *
 * Toutes les info doivent matcher exactement Google Business Profile
 * (NAP : Name, Address, Phone consistency = signal SEO local critique).
 */
const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Restaurant", "FastFoodRestaurant"],
  "@id": "https://southstreetfood.vercel.app/#restaurant",
  name: "South Street Food",
  description:
    "Fast food à Bayonne. Burgers, tacos, wraps et bowls artisanaux. Livraison sur Bayonne, Anglet, Biarritz et alentours. Ouvert jusqu'à 4h du matin.",
  url: "https://southstreetfood.vercel.app",
  telephone: "+33769799189",
  email: "contact@southstreetfood.fr",
  image: [
    "https://southstreetfood.vercel.app/brand/og-image.png",
  ],
  priceRange: "€€",
  servesCuisine: ["Fast Food", "Burger", "Tex-Mex", "Street Food"],
  address: {
    "@type": "PostalAddress",
    streetAddress: "32 Chemin de Loustaunaou",
    addressLocality: "Bayonne",
    postalCode: "64100",
    addressRegion: "Pyrénées-Atlantiques",
    addressCountry: "FR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 43.4929,
    longitude: -1.4748,
  },
  hasMap: "https://www.google.com/maps?q=43.4929,-1.4748",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "19:00",
      closes: "04:00",
    },
  ],
  areaServed: [
    { "@type": "City", name: "Bayonne" },
    { "@type": "City", name: "Anglet" },
    { "@type": "City", name: "Biarritz" },
    { "@type": "City", name: "Tarnos" },
    { "@type": "City", name: "Boucau" },
    { "@type": "City", name: "Ondres" },
    { "@type": "City", name: "Saint-Martin-de-Seignanx" },
    { "@type": "City", name: "Bassussarry" },
    { "@type": "City", name: "Bidart" },
    { "@type": "City", name: "Saint-André-de-Seignanx" },
    { "@type": "City", name: "Labenne" },
    { "@type": "City", name: "Saint-Pierre-d'Irube" },
  ],
  hasMenu: {
    "@type": "Menu",
    "@id": "https://southstreetfood.vercel.app/menu",
    name: "Menu South Street Food",
    url: "https://southstreetfood.vercel.app/menu",
  },
  acceptsReservations: false,
  paymentAccepted: ["Cash", "Credit Card", "Stripe"],
  currenciesAccepted: "EUR",
  potentialAction: {
    "@type": "OrderAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://southstreetfood.vercel.app/menu",
      inLanguage: "fr-FR",
      actionPlatform: [
        "http://schema.org/DesktopWebPlatform",
        "http://schema.org/MobileWebPlatform",
      ],
    },
    deliveryMethod: [
      "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet",
      "http://purl.org/goodrelations/v1#DeliveryModePickUp",
    ],
  },
};

/**
 * WebSite + SearchAction : Google peut afficher une "sitelinks searchbox"
 * sous le résultat (recherche directe dans Google avant même de cliquer).
 */
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://southstreetfood.vercel.app/#website",
  url: "https://southstreetfood.vercel.app",
  name: "South Street Food",
  description: "Fast food à Bayonne — Livraison BAB jusqu'à 4h",
  publisher: {
    "@id": "https://southstreetfood.vercel.app/#restaurant",
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate:
        "https://southstreetfood.vercel.app/menu?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
  inLanguage: "fr-FR",
};

/**
 * Organization schema — credibilite + author/publisher pour les AI engines.
 * Perplexity/ChatGPT citent l'organization comme source.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://southstreetfood.vercel.app/#organization",
  name: "South Street Food",
  url: "https://southstreetfood.vercel.app",
  logo: "https://southstreetfood.vercel.app/brand/og-image.png",
  sameAs: [
    // Sera rempli quand les profils sociaux seront officiels
    // "https://www.instagram.com/southstreetfood",
    // "https://www.tiktok.com/@southstreetfood",
    // "https://www.facebook.com/southstreetfood",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+33769799189",
    contactType: "customer service",
    areaServed: "FR",
    availableLanguage: ["French"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(restaurantJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        {/* Hint for AI engines : ce site est crawlable, voici le llms.txt */}
        <link rel="alternate" type="text/markdown" href="/llms.txt" />
      </head>
      <body
        className={`${inter.variable} font-sans min-h-dvh flex flex-col antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              className: "!rounded-xl !border-border",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
