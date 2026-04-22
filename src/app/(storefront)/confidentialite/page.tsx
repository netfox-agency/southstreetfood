import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Politique de confidentialité | SOUTH STREET FOOD",
  description:
    "Politique de confidentialité de South Street Food — traitement des données personnelles conformément au RGPD.",
  robots: "index, follow",
};

// Conforme RGPD (UE 2016/679) et Loi Informatique et Libertes. Couvre les
// donnees collectees pour commander (nom, tel, email, adresse) + cookies
// techniques essentiels.
export default function ConfidentialitePage() {
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

        <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-[1] tracking-wide uppercase mb-4">
          Politique de confidentialité
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Dernière mise à jour :{" "}
          {new Date().toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <p className="text-muted-foreground">
              South Street Food attache une grande importance à la protection
              de vos données personnelles. Cette politique explique quelles
              données nous collectons, pourquoi, combien de temps nous les
              gardons, et quels sont vos droits.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              1. Responsable du traitement
            </h2>
            <p className="text-muted-foreground">
              South Street Food — SIREN 948 154 380 — {BRAND.address}.
              <br />
              Contact :{" "}
              <a
                href={`mailto:${BRAND.email}`}
                className="text-brand hover:underline"
              >
                {BRAND.email}
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              2. Données collectées
            </h2>
            <p className="text-muted-foreground mb-2">
              Lorsque vous passez commande, nous collectons :
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Nom et prénom</li>
              <li>Numéro de téléphone</li>
              <li>Adresse email (optionnelle)</li>
              <li>Adresse de livraison (si livraison)</li>
              <li>Contenu de la commande et montant</li>
              <li>
                Données techniques automatiques (adresse IP, type
                d&apos;appareil, navigateur) à des fins de sécurité
              </li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Aucune donnée bancaire n&apos;est collectée ou stockée par le
              site : le paiement s&apos;effectue directement sur place.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              3. Finalités &amp; bases légales
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">
                  Traitement de la commande
                </strong>{" "}
                (préparation, livraison, contact en cas de problème) — base
                légale : exécution du contrat.
              </li>
              <li>
                <strong className="text-foreground">
                  Obligations comptables et fiscales
                </strong>{" "}
                — base légale : obligation légale.
              </li>
              <li>
                <strong className="text-foreground">
                  Sécurité du site
                </strong>{" "}
                (prévention de la fraude) — base légale : intérêt légitime.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              4. Durée de conservation
            </h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Données de commande : 3 ans après la dernière commande</li>
              <li>
                Documents comptables (factures) : 10 ans (obligation légale)
              </li>
              <li>Logs techniques : 12 mois maximum</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              5. Destinataires
            </h2>
            <p className="text-muted-foreground">
              Vos données ne sont partagées qu&apos;avec les personnes et
              services strictement nécessaires au traitement de votre commande :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>L&apos;équipe du restaurant (préparation et livraison)</li>
              <li>
                Nos sous-traitants techniques : Vercel (hébergement du site)
                et Supabase (base de données, hébergée dans l&apos;UE)
              </li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Vos données ne sont jamais vendues à des tiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              6. Cookies
            </h2>
            <p className="text-muted-foreground">
              Le site utilise uniquement des cookies techniques essentiels au
              fonctionnement (session, panier, authentification du personnel).
              Aucun cookie publicitaire, de ciblage ou de mesure d&apos;audience
              tierce n&apos;est déposé. Ces cookies ne nécessitent pas votre
              consentement selon la CNIL.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              7. Vos droits
            </h2>
            <p className="text-muted-foreground mb-2">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Droit d&apos;accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l&apos;effacement (« droit à l&apos;oubli »)</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit à la portabilité de vos données</li>
              <li>Droit d&apos;opposition au traitement</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              Pour exercer ces droits, écrivez-nous à{" "}
              <a
                href={`mailto:${BRAND.email}`}
                className="text-brand hover:underline"
              >
                {BRAND.email}
              </a>
              . Nous vous répondrons sous 30 jours maximum.
            </p>
            <p className="text-muted-foreground mt-2">
              Vous pouvez également introduire une réclamation auprès de la
              CNIL :{" "}
              <a
                href="https://www.cnil.fr/fr/plaintes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                cnil.fr/fr/plaintes
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              8. Sécurité
            </h2>
            <p className="text-muted-foreground">
              Nous mettons en œuvre les mesures techniques et organisationnelles
              appropriées (chiffrement HTTPS, accès restreint, hébergement UE)
              pour protéger vos données contre toute perte, accès non autorisé
              ou altération.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
