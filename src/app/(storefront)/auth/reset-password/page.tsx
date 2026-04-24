"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * /auth/reset-password
 *
 * Atterrissage apres clic sur le lien email envoye par Supabase auth.
 * Supabase gere le token dans l'URL (hash fragment) et cree une session
 * temporaire avant de hit cette page. On verifie qu'on a bien une session
 * puis on laisse le user choisir son nouveau mot de passe.
 *
 * Si pas de session → le lien est expire / invalide → on redirige vers
 * /auth/forgot-password avec un message.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);

  // Verifier la session au mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(Boolean(data.session));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Mot de passe : 6 caracteres minimum");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error("Erreur : " + error.message);
        setLoading(false);
        return;
      }
      toast.success("Mot de passe mis a jour !");
      router.push("/fidelite");
      router.refresh();
    } catch {
      toast.error("Erreur inattendue");
      setLoading(false);
    }
  };

  if (sessionReady === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a] rounded-full animate-spin" />
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-md px-5 pt-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Connexion
          </Link>
        </div>
        <div className="mx-auto max-w-md px-5 py-10">
          <h1 className="font-display text-5xl text-[#1d1d1f] tracking-tight leading-[0.95] mb-2">
            Lien expire.
          </h1>
          <p className="text-[14px] text-[#86868b] mb-6">
            Ce lien n&apos;est plus valide. Demande un nouveau lien pour
            reinitialiser ton mot de passe.
          </p>
          <Link
            href="/auth/forgot-password"
            className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-[#0a0a0a] text-white font-semibold text-[14px] hover:bg-[#1d1d1f] transition-colors"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-md px-5 pt-6">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Connexion
        </Link>
      </div>

      <div className="mx-auto max-w-md px-5 py-10">
        <div className="h-14 w-14 rounded-2xl bg-[#0a0a0a] flex items-center justify-center mb-6">
          <ShieldCheck className="h-7 w-7 text-white" />
        </div>

        <h1 className="font-display text-5xl sm:text-6xl text-[#1d1d1f] tracking-tight leading-[0.95] mb-2">
          Nouveau mdp.
        </h1>
        <p className="text-[14px] sm:text-base text-[#86868b] mb-8">
          Choisis un mot de passe solide de 6 caracteres minimum.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-[12px] font-medium text-[#86868b] mb-1.5 block">
              Nouveau mot de passe
            </span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
              autoFocus
              className="w-full h-12 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[15px] text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 focus:border-[#0a0a0a]/30 transition-all"
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-medium text-[#86868b] mb-1.5 block">
              Confirmer le mot de passe
            </span>
            <input
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
              className="w-full h-12 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[15px] text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 focus:border-[#0a0a0a]/30 transition-all"
            />
          </label>

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full h-12 rounded-full bg-[#0a0a0a] text-white font-semibold text-[15px] hover:bg-[#1d1d1f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "Mettre a jour"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
