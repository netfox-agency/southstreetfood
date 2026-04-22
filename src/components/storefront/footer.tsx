import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { BRAND } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-brand text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo size="md" />
            <p className="mt-3 text-sm text-white/70 max-w-sm">
              {BRAND.description}
            </p>
            <div className="flex items-center gap-3 mt-4">
              {BRAND.instagram && (
                <a
                  href={BRAND.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-white">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/menu"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Notre Menu
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Commander
                </Link>
              </li>
              <li>
                <Link
                  href="/fidelite"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Programme Fidelite
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-white">Informations</h3>
            <ul className="space-y-2">
              <li className="text-sm text-white/70">
                Bayonne, France
              </li>
              <li className="text-sm text-white/70">
                Livraison BAB
              </li>
              <li className="text-sm text-white font-medium">
                Ouvert jusqu&apos;a 4h
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/20 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-white/70">
            &copy; {new Date().getFullYear()} South Street Food. Tous droits
            reserves.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/mentions-legales"
              className="text-xs text-white/70 hover:text-white transition-colors"
            >
              Mentions légales
            </Link>
            <Link
              href="/cgv"
              className="text-xs text-white/70 hover:text-white transition-colors"
            >
              CGV
            </Link>
            <Link
              href="/confidentialite"
              className="text-xs text-white/70 hover:text-white transition-colors"
            >
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
