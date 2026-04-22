import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Gift, ShoppingBag, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LogoutButton } from "./logout-button";

export const dynamic = "force-dynamic";

/**
 * /account — Dashboard du client connecte.
 *
 * Server component : check auth + fetch profile + solde fidelite
 * pour affichage immediat sans flash. Logout button client pour
 * gerer la deconnexion.
 */
export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/account");
  }

  const admin = createAdminClient();
  const { data: profileRow } = await admin
    .from("profiles")
    .select("full_name, phone, loyalty_points")
    .eq("id", user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileRow as any;
  const fullName: string = profile?.full_name ?? "";
  const firstName = fullName.split(" ")[0] || "toi";
  const points: number = profile?.loyalty_points ?? 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-5 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>
      </div>

      <div className="mx-auto max-w-2xl px-5 py-10">
        <div className="mb-8">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#86868b] mb-2">
            Mon compte
          </p>
          <h1 className="font-display text-5xl sm:text-6xl text-[#1d1d1f] tracking-tight leading-[0.95]">
            Salut {firstName}.
          </h1>
          <p className="text-[14px] text-[#86868b] mt-2">{user.email}</p>
        </div>

        <Link
          href="/fidelite"
          className="block mb-4 relative overflow-hidden rounded-2xl bg-[#0a0a0a] text-white p-5 sm:p-6 hover:bg-[#1d1d1f] transition-colors"
        >
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#e8416f]/15 blur-3xl"
          />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-[#e8416f]" />
                <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#e8416f]">
                  South Street Rewards
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl sm:text-6xl leading-none tabular-nums">
                  {points}
                </span>
                <span className="text-sm font-semibold text-white/60">
                  points
                </span>
              </div>
              <p className="text-[12px] text-white/60 mt-2">
                Voir mes recompenses &rarr;
              </p>
            </div>
          </div>
        </Link>

        <nav className="space-y-2 mb-6">
          <AccountLink
            href="/account/orders"
            icon={ShoppingBag}
            title="Mes commandes"
            subtitle="Historique et suivi"
          />
          <AccountLink
            href="/fidelite"
            icon={Gift}
            title="Programme fidelite"
            subtitle={`${points} points disponibles`}
          />
        </nav>

        <div className="rounded-2xl border border-[#e5e5ea] bg-white p-5 mb-6">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-[#86868b] mb-3">
            Informations
          </p>
          <dl className="space-y-2.5 text-[14px]">
            <div className="flex justify-between gap-4">
              <dt className="text-[#86868b]">Nom</dt>
              <dd className="text-[#1d1d1f] font-medium text-right truncate">
                {fullName || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#86868b]">Email</dt>
              <dd className="text-[#1d1d1f] font-medium text-right truncate">
                {user.email}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#86868b]">Telephone</dt>
              <dd className="text-[#1d1d1f] font-medium text-right truncate">
                {profile?.phone || "—"}
              </dd>
            </div>
          </dl>
        </div>

        <LogoutButton />
      </div>
    </div>
  );
}

function AccountLink({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3.5 p-4 rounded-2xl border border-[#e5e5ea] bg-white hover:border-[#0a0a0a]/20 hover:shadow-[0_4px_12px_-6px_rgba(0,0,0,0.08)] transition-all"
    >
      <div className="h-10 w-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-[#1d1d1f]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[#1d1d1f]">{title}</p>
        <p className="text-[12px] text-[#86868b] mt-0.5 truncate">{subtitle}</p>
      </div>
      <svg
        className="h-4 w-4 text-[#c7c7cc]"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 01.02-1.06L10.168 10 7.23 6.29a.75.75 0 111.08-1.04l3.5 3.75a.75.75 0 010 1l-3.5 3.75a.75.75 0 01-1.06.02z"
          clipRule="evenodd"
        />
      </svg>
    </Link>
  );
}
