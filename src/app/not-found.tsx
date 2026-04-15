import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-[#f5f5f7] flex flex-col items-center justify-center px-5 text-center">
      <Logo size="lg" />

      <h1 className="mt-8 text-6xl font-black text-[#1d1d1f] tabular-nums">
        404
      </h1>
      <p className="mt-2 text-lg text-[#86868b]">
        Cette page n&apos;existe pas ou a ete deplacee.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center h-12 px-8 rounded-2xl bg-[#1d1d1f] text-white font-semibold text-sm hover:opacity-90 transition-all"
        >
          Retour a l&apos;accueil
        </Link>
        <Link
          href="/menu"
          className="inline-flex items-center justify-center h-12 px-8 rounded-2xl bg-white border border-[#e5e5ea] text-[#1d1d1f] font-semibold text-sm hover:bg-[#f5f5f7] transition-all"
        >
          Voir le menu
        </Link>
      </div>
    </div>
  );
}
