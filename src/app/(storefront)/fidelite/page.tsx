"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star, Gift, Trophy, Phone, Search } from "lucide-react";

const REWARDS = [
  { name: "Frites Maison offertes", points: 100, icon: "\uD83C\uDF5F" },
  { name: "Boisson offerte", points: 80, icon: "\uD83E\uDD64" },
  { name: "-20% sur la commande", points: 200, icon: "\uD83D\uDCB0" },
  { name: "Burger offert", points: 300, icon: "\uD83C\uDF54" },
];

export default function FidelitePage() {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<{
    totalPoints: number;
    totalOrders: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleLookup = async () => {
    const clean = phone.replace(/\s/g, "");
    if (clean.length < 10) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/loyalty/balance?phone=${encodeURIComponent(phone.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        setResult({ totalPoints: data.totalPoints || 0, totalOrders: data.totalOrders || 0 });
      } else {
        setResult({ totalPoints: 0, totalOrders: 0 });
      }
    } catch {
      setResult({ totalPoints: 0, totalOrders: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto max-w-lg px-5 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>

        <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-1">
          Programme Fidelite
        </h1>
        <p className="text-[#86868b] text-sm mb-8">
          Gagnez des points a chaque commande, echangez-les contre des recompenses.
        </p>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5 mb-4">
          <h2 className="font-semibold text-[15px] text-[#1d1d1f] mb-4">
            Comment ca marche ?
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Star className="h-[18px] w-[18px] text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1d1d1f]">
                  10 points par euro depense
                </p>
                <p className="text-xs text-[#86868b] mt-0.5">
                  Vos points s&apos;accumulent automatiquement via votre numero de telephone.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Gift className="h-[18px] w-[18px] text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1d1d1f]">
                  Echangez vos points
                </p>
                <p className="text-xs text-[#86868b] mt-0.5">
                  Frites offertes, boissons, reductions... des 80 points.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Phone className="h-[18px] w-[18px] text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1d1d1f]">
                  Pas de compte necessaire
                </p>
                <p className="text-xs text-[#86868b] mt-0.5">
                  Votre numero de telephone suffit. Pas d&apos;inscription, pas de carte.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5 mb-4">
          <h2 className="font-semibold text-[15px] text-[#1d1d1f] mb-4">
            Recompenses
          </h2>
          <div className="space-y-3">
            {REWARDS.map((r) => (
              <div key={r.name} className="flex items-center gap-3">
                <span className="text-2xl">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1d1d1f]">
                    {r.name}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#86868b] bg-[#f5f5f7] px-2.5 py-1 rounded-full tabular-nums whitespace-nowrap">
                  {r.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Balance lookup */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5 mb-4">
          <h2 className="font-semibold text-[15px] text-[#1d1d1f] mb-3">
            Consulter mon solde
          </h2>
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="06 12 34 56 78"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setSearched(false);
                setResult(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              className="flex-1 h-11 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-[#1d1d1f]/30 transition-all"
            />
            <button
              onClick={handleLookup}
              disabled={phone.replace(/\s/g, "").length < 10 || loading}
              className="h-11 px-5 rounded-xl bg-[#1d1d1f] text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>
          </div>

          {searched && result && (
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#1d1d1f] tabular-nums">
                {result.totalPoints} points
              </p>
              <p className="text-xs text-[#86868b] mt-1">
                {result.totalOrders} commande{result.totalOrders !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {searched && result && result.totalOrders === 0 && (
            <p className="mt-3 text-xs text-[#86868b] text-center">
              Aucune commande trouvee. Passez votre premiere commande pour commencer a gagner des points !
            </p>
          )}
        </div>

        {/* CTA */}
        <Link
          href="/menu"
          className="block w-full h-13 rounded-2xl bg-[#1d1d1f] text-white font-semibold text-[15px] hover:opacity-90 transition-all text-center leading-[3.25rem]"
        >
          Commander et gagner des points
        </Link>
      </div>
    </div>
  );
}
