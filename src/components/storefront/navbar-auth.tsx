"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { User, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Entree auth dans la navbar. Deux etats :
 *  - Connecte : icone User → /account (menu compte + logout)
 *  - Non connecte : bouton "Connexion" avec icone → /auth/login
 *
 * Abonne au changement d'etat Supabase Auth pour refresh en temps reel
 * (login/logout propage instantanement).
 */
export function NavbarAuth() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setLoggedIn(Boolean(data.user));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (mounted) setLoggedIn(Boolean(session?.user));
      // Refresh server components (navbar position, /fidelite, etc.)
      router.refresh();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // Avant hydratation : placeholder vide, evite flash visuel
  if (loggedIn === null) {
    return <div className="w-9 h-9" aria-hidden />;
  }

  if (loggedIn) {
    const isActive = pathname?.startsWith("/account");
    return (
      <Link
        href="/account"
        className={`inline-flex items-center justify-center h-9 w-9 rounded-full transition-colors ${
          isActive
            ? "bg-white/10 text-white"
            : "text-white/60 hover:text-white hover:bg-white/5"
        }`}
        aria-label="Mon compte"
      >
        <User className="h-[18px] w-[18px]" />
      </Link>
    );
  }

  // Non connecte : CTA Connexion
  return (
    <Link
      href={`/auth/login${pathname && pathname !== "/" ? `?redirect=${encodeURIComponent(pathname)}` : ""}`}
      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors"
      aria-label="Se connecter"
    >
      <LogIn className="h-4 w-4" />
      <span className="hidden sm:inline">Connexion</span>
    </Link>
  );
}
