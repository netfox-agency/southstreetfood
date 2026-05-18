import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FAQSection } from "@/components/storefront/faq-section";

export const metadata: Metadata = {
  title: "FAQ — Questions fréquentes · South Street Food Bayonne",
  description:
    "Toutes les réponses sur la livraison, les horaires, le menu, le programme fidélité et le click & collect chez South Street Food à Bayonne.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ South Street Food — Tout savoir sur la livraison Bayonne",
    description:
      "Horaires, livraison, menu, fidélité — les réponses aux questions les plus posées.",
    url: "https://southstreetfood.vercel.app/faq",
  },
};

/**
 * Page FAQ dediee.
 *
 * Strategie : la FAQ etait sur la home, le client la trouvait visuellement
 * trop lourde. Solution : la deplacer sur /faq, ajouter un lien depuis le
 * footer. La home reste clean, mais Google indexe la FAQ + son schema sur
 * une page dediee → tjrs visible dans les "People Also Ask".
 */
export default function FAQPage() {
  return (
    <div className="relative min-h-screen bg-[#fafafa] overflow-hidden">
      <div className="absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full bg-[#e8416f]/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-[#e8416f]/8 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-5 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>
      </div>

      <div className="relative -mt-12">
        <FAQSection />
      </div>
    </div>
  );
}
