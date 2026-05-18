"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

/**
 * FAQ section — SEO gold.
 *
 * 2 effets :
 *  1. Schema.org FAQPage → Google affiche les questions dans les "People
 *     Also Ask" / rich snippets sous le résultat. 3-5x plus de clics CTR.
 *  2. Réponses optimisées pour les featured snippets (réponses courtes
 *     paragraphe ou bullet liste).
 *
 * Les questions ciblent les requêtes longue-traîne les plus communes
 * pour un fast food de la zone BAB.
 */
const FAQS = [
  {
    q: "Quels sont vos horaires de livraison à Bayonne ?",
    a: "South Street Food livre tous les jours de 19h à 4h du matin sur Bayonne et toute la zone BAB (Anglet, Biarritz, Tarnos, Boucau, Ondres, Bidart, Bassussarry, Labenne, Saint-Martin-de-Seignanx, Saint-André-de-Seignanx, Saint-Pierre-d'Irube). Commande possible jusqu'à 3h30.",
  },
  {
    q: "Combien coûte la livraison ?",
    a: "Les frais de livraison varient selon la ville : 3€ pour Bayonne, 4€ pour Anglet/Tarnos/Boucau, 5€ pour Biarritz/Ondres/Saint-Martin-de-Seignanx, 6€ pour les communes plus éloignées (Bidart, Bassussarry, Labenne, etc.). Commande minimum 15€ à 30€ selon la zone.",
  },
  {
    q: "Quel est le temps de livraison moyen ?",
    a: "En moyenne 30 à 40 minutes entre la commande et la livraison à votre porte. Le temps de préparation cuisine est de 20-25 min, plus le trajet selon votre ville.",
  },
  {
    q: "Quels burgers proposez-vous ?",
    a: "Notre carte burgers : Cheese (5€), Le Big Mc (7€), Big Cheese (8€), Montagnard burger raclette/bacon (11€), Le 180g (11€). Tous nos burgers sont préparés à la commande dans des pains briochés moelleux avec des produits frais.",
  },
  {
    q: "Faites-vous des tacos style street food ?",
    a: "Oui, nos tacos sont disponibles en 3 tailles : M (1 viande, 9€), L (2 viandes, 10€), XL (3 viandes, 11€). Choix de viandes : poulet, cordon bleu de dinde, viande hachée mariné, kebab, escalope. Servis avec frites et sauce fromagère.",
  },
  {
    q: "Êtes-vous ouverts la nuit à Bayonne ?",
    a: "Oui, South Street Food est ouvert tous les soirs jusqu'à 4h du matin. C'est l'un des rares fast food de la zone BAB ouverts si tard. Idéal après une soirée ou pour les couche-tard.",
  },
  {
    q: "Comment fonctionne le programme fidélité ?",
    a: "1€ dépensé = 1 point. À partir de 50 points, vous débloquez des récompenses : 50pts (1 boisson), 75pts (1 dessert), 100pts (1 sandwich), 125pts (sandwich + frites), 150pts (1 menu complet), 200pts (menu au choix + dessert). Pas d'expiration des points.",
  },
  {
    q: "Peut-on faire du click and collect ?",
    a: "Oui, vous pouvez commander en ligne et récupérer votre commande au restaurant, situé 32 Chemin de Loustaunaou à Bayonne. C'est gratuit (pas de frais de livraison) et la commande est prête en 20-25 min.",
  },
  {
    q: "Acceptez-vous les paiements par carte ?",
    a: "Oui, paiement sécurisé en ligne par carte bancaire via Stripe (Visa, Mastercard, Apple Pay, Google Pay). Pour les commandes click & collect, le paiement se fait à la commande en ligne.",
  },
];

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  // Schema.org FAQPage — Google rich snippets
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="relative py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#e8416f] mb-3">
              Questions fréquentes
            </p>
            <h2 className="font-display text-4xl sm:text-5xl text-[#1d1d1f] tracking-tight leading-[0.95]">
              Tout ce qu&apos;il faut savoir.
            </h2>
            <p className="mt-4 text-[#86868b]">
              Livraison, horaires, menu, fidélité — voici les réponses aux
              questions les plus posées.
            </p>
          </div>

          <div className="space-y-2">
            {FAQS.map((faq, i) => {
              const isOpen = openIdx === i;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl bg-white border border-[#e5e5ea] overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#fafafa] transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="font-semibold text-[15px] text-[#1d1d1f]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-[#86868b] shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 text-[14px] text-[#1d1d1f] leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
