import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Mentions légales | SOUTH STREET FOOD",
  description:
    "Mentions légales de South Street Food — éditeur, hébergeur, coordonnées.",
  robots: "index, follow",
};

// Conforme LCEN art. 6-III et RGPD. Contenu minimaliste mais complet pour un
// e-commerce alimentaire en France (franchise en base TVA supposee).
export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-white pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;accueil
        </Link>

        <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-[1] tracking-wide uppercase mb-8">
          Mentions légales
        </h1>

        <div className="prose prose-neutral max-w-none space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Éditeur du site
            </h2>
            <p className="text-muted-foreground">
              <strong className="text-foreground">South Street Food</strong>
              <br />
              Restaurant de street food, livraison sur Bayonne-Anglet-Biarritz.
              <br />
              Adresse : {BRAND.address}
              <br />
              Téléphone :{" "}
              <a
                href={`tel:${BRAND.phone.replace(/\s/g, "")}`}
                className="text-brand hover:underline"
              >
                {BRAND.phone}
              </a>
              <br />
              Email :{" "}
              <a
                href={`mailto:${BRAND.email}`}
                className="text-brand hover:underline"
              >
                {BRAND.email}
              </a>
              <br />
              SIREN : 948 154 380
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Directeur de la publication
            </h2>
            <p className="text-muted-foreground">Le gérant de South Street Food.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Hébergement
            </h2>
            <p className="text-muted-foreground">
              Le site est hébergé par :
            </p>
            <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
              <li>
                <strong className="text-foreground">Vercel Inc.</strong> — 340
                S Lemon Ave #4133, Walnut, CA 91789, États-Unis —{" "}
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  vercel.com
                </a>
              </li>
              <li>
                Base de données : <strong className="text-foreground">Supabase</strong>{" "}
                (hébergement en Union Européenne — Francfort)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Propriété intellectuelle
            </h2>
            <p className="text-muted-foreground">
              L&apos;ensemble des contenus présents sur le site (textes,
              images, logos, photos des produits) est la propriété exclusive de
              South Street Food ou de ses partenaires. Toute reproduction,
              même partielle, est interdite sans autorisation préalable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Données personnelles
            </h2>
            <p className="text-muted-foreground">
              Le traitement de vos données personnelles est décrit dans notre{" "}
              <Link
                href="/confidentialite"
                className="text-brand hover:underline"
              >
                politique de confidentialité
              </Link>
              . Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de
              rectification et de suppression de vos données en nous écrivant
              à{" "}
              <a
                href={`mailto:${BRAND.email}`}
                className="text-brand hover:underline"
              >
                {BRAND.email}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Conditions de vente
            </h2>
            <p className="text-muted-foreground">
              Les conditions applicables à toute commande sont détaillées dans
              nos{" "}
              <Link href="/cgv" className="text-brand hover:underline">
                Conditions Générales de Vente
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Médiation à la consommation
            </h2>
            <p className="text-muted-foreground">
              Conformément à l&apos;article L.612-1 du Code de la consommation,
              tout consommateur a le droit de recourir gratuitement à un
              médiateur en cas de litige. Une plateforme européenne de
              règlement en ligne des litiges est disponible à l&apos;adresse
              suivante :{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                ec.europa.eu/consumers/odr
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
