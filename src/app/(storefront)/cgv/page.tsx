import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente | SOUTH STREET FOOD",
  description:
    "Conditions générales de vente de South Street Food — commande, livraison, paiement, réclamations.",
  robots: "index, follow",
};

// CGV conformes Code de la consommation art. L221-5 (ecommerce BtoC) et
// Code commerce art. L441-1. Minimum pour un resto de livraison qui prend
// commande en ligne + paiement au comptoir.
export default function CGVPage() {
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
          Conditions Générales de Vente
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          En vigueur au{" "}
          {new Date().toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              1. Objet
            </h2>
            <p className="text-muted-foreground">
              Les présentes CGV régissent toute commande passée auprès de
              South Street Food (ci-après « le Restaurant ») sur le site{" "}
              <span className="text-foreground">southstreetfood.fr</span> ou
              directement au comptoir. Toute commande implique
              l&apos;acceptation sans réserve de ces conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              2. Produits
            </h2>
            <p className="text-muted-foreground">
              Le Restaurant propose à la vente des plats préparés (burgers,
              tacos, wraps, frites, desserts) et des boissons. Les photographies
              des produits sont indicatives et n&apos;engagent pas le
              Restaurant. La liste des allergènes majeurs est disponible sur
              chaque fiche produit et peut être précisée sur demande au{" "}
              <a
                href={`tel:${BRAND.phone.replace(/\s/g, "")}`}
                className="text-brand hover:underline"
              >
                {BRAND.phone}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              3. Commande
            </h2>
            <p className="text-muted-foreground">
              La commande est validée après confirmation des articles, du mode
              de livraison (à emporter, livraison ou sur place) et de vos
              coordonnées. Une fois envoyée, la commande ne peut plus être
              modifiée sans l&apos;accord du Restaurant. Le Restaurant se
              réserve le droit de refuser ou d&apos;annuler toute commande en
              cas de rupture de stock, erreur manifeste de prix, ou zone non
              desservie.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              4. Prix et paiement
            </h2>
            <p className="text-muted-foreground">
              Les prix sont indiqués en euros toutes taxes comprises (TTC).
              <br />
              Le paiement s&apos;effectue{" "}
              <strong className="text-foreground">sur place</strong>, en
              espèces ou par carte bancaire, à la livraison ou au retrait de
              la commande. Aucun prélèvement n&apos;est effectué lors de la
              validation de la commande en ligne.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              5. Livraison
            </h2>
            <p className="text-muted-foreground">
              La livraison est assurée sur les communes listées dans la zone
              de livraison consultable sur la page d&apos;accueil. Les frais
              de livraison varient selon la commune (de 3 à 6 €) et sont
              indiqués avant validation de la commande.
            </p>
            <p className="text-muted-foreground mt-2">
              Le délai moyen de livraison est d&apos;environ 40 minutes à
              partir de la confirmation de commande. Ce délai est donné à
              titre indicatif et peut varier selon l&apos;affluence, la météo
              ou les conditions de circulation. Tout retard éventuel
              n&apos;ouvre pas droit à indemnité.
            </p>
            <p className="text-muted-foreground mt-2">
              Le client doit être joignable sur le numéro de téléphone fourni
              lors de la commande. En cas d&apos;absence ou d&apos;adresse
              incorrecte rendant la livraison impossible, la commande sera
              considérée comme due et ne sera pas remboursée.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              6. Retrait (click &amp; collect)
            </h2>
            <p className="text-muted-foreground">
              Les commandes à emporter sont à retirer au restaurant situé au
              {" "}
              {BRAND.address}. Une commande non retirée dans les 45 minutes
              suivant sa préparation pourra être considérée comme abandonnée.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              7. Droit de rétractation
            </h2>
            <p className="text-muted-foreground">
              Conformément à l&apos;article L221-28 du Code de la consommation,
              le droit de rétractation ne s&apos;applique pas aux produits
              alimentaires préparés à la demande et susceptibles de se périmer
              rapidement. Toute commande validée est donc ferme et définitive.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              8. Réclamations
            </h2>
            <p className="text-muted-foreground">
              Toute réclamation concernant un produit ou une livraison doit
              être adressée dans les 24 heures à{" "}
              <a
                href={`mailto:${BRAND.email}`}
                className="text-brand hover:underline"
              >
                {BRAND.email}
              </a>{" "}
              ou au{" "}
              <a
                href={`tel:${BRAND.phone.replace(/\s/g, "")}`}
                className="text-brand hover:underline"
              >
                {BRAND.phone}
              </a>
              , en précisant votre numéro de commande et la nature du problème.
              Le Restaurant s&apos;engage à traiter toute réclamation dans les
              meilleurs délais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              9. Responsabilité
            </h2>
            <p className="text-muted-foreground">
              Le Restaurant ne saurait être tenu responsable des dommages
              résultant d&apos;un mauvais usage des produits (consommation
              malgré un allergène signalé, conservation inadaptée après
              livraison, etc.) ou d&apos;informations incomplètes fournies
              par le client lors de la commande.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              10. Droit applicable &amp; litiges
            </h2>
            <p className="text-muted-foreground">
              Les présentes CGV sont soumises au droit français. En cas de
              litige, une solution amiable sera recherchée en priorité. À
              défaut, le litige pourra être porté devant le médiateur de la
              consommation (voir{" "}
              <Link
                href="/mentions-legales"
                className="text-brand hover:underline"
              >
                mentions légales
              </Link>
              ) ou devant les juridictions françaises compétentes.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
