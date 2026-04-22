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
              {BRAND.tiktok && (
                <a
                  href={BRAND.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="TikTok"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/>
                  </svg>
                </a>
              )}
              {BRAND.snapchat && (
                <a
                  href={BRAND.snapchat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="Snapchat"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2c3.22 0 5.61 2.51 5.61 5.83 0 .64 0 1.18-.06 1.67.12.05.24.1.4.1.54 0 .83-.39 1.24-.39.49 0 1.26.35 1.26.88 0 .45-1.17.85-1.55 1.07-.45.26-.78.49-.78.85 0 .22.15.41.29.6.52.7 2.12 2.06 3.66 2.48.34.09.45.33.45.52 0 .48-.47.7-.84.84-.45.16-1.38.25-1.71.28-.21.02-.31.5-.44.9-.04.14-.16.26-.36.26-.44 0-1.15-.36-2.36-.36-1.53 0-2.02 1.23-3.81 1.23-1.78 0-2.27-1.23-3.81-1.23-1.21 0-1.92.36-2.36.36-.2 0-.32-.12-.36-.26-.13-.4-.23-.88-.44-.9-.33-.03-1.26-.12-1.71-.28-.37-.14-.84-.36-.84-.84 0-.19.11-.43.45-.52 1.54-.42 3.14-1.78 3.66-2.48.14-.19.29-.38.29-.6 0-.36-.33-.59-.78-.85-.38-.22-1.55-.62-1.55-1.07 0-.53.77-.88 1.26-.88.41 0 .7.39 1.24.39.16 0 .28-.05.4-.1-.06-.49-.06-1.03-.06-1.67C6.39 4.51 8.78 2 12 2z"/>
                  </svg>
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
