"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/reset-password`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: redirectUrl },
      );

      // Message neutre : on ne revele pas si l'email existe ou non (privacy).
      // Dans tous les cas on affiche l'ecran "envoye" — meme si l'email
      // n'existe pas en base, aucune info sensible ne fuite.
      if (error && !error.message.toLowerCase().includes("rate")) {
        // Silent pour les erreurs non-rate-limit. Rate limit on le dit.
      }
      if (error?.message.toLowerCase().includes("rate")) {
        toast.error("Trop de tentatives, attends quelques minutes");
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      toast.error("Erreur inattendue");
    } finally {
      setLoading(false);
    }
  };

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
        {sent ? (
          <div>
            <div className="h-14 w-14 rounded-2xl bg-[#0a0a0a] flex items-center justify-center mb-6">
              <MailCheck className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-display text-5xl sm:text-6xl text-[#1d1d1f] tracking-tight leading-[0.95] mb-2">
              Verifie ta boite.
            </h1>
            <p className="text-[14px] sm:text-base text-[#86868b] mb-6 leading-relaxed">
              Si un compte existe avec{" "}
              <span className="font-semibold text-[#1d1d1f]">
                {email.trim()}
              </span>
              , tu recois un mail avec un lien pour reinitialiser ton mot de
              passe. Le lien expire dans 1 heure.
            </p>
            <p className="text-[13px] text-[#86868b] mb-6">
              Pense a verifier ton dossier spam.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-[#0a0a0a] text-white font-semibold text-[14px] hover:bg-[#1d1d1f] transition-colors"
            >
              Retour a la connexion
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-5xl sm:text-6xl text-[#1d1d1f] tracking-tight leading-[0.95] mb-2">
              Oublie ?
            </h1>
            <p className="text-[14px] sm:text-base text-[#86868b] mb-8">
              Entre ton email. On t&apos;envoie un lien pour reinitialiser ton
              mot de passe.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-[12px] font-medium text-[#86868b] mb-1.5 block">
                  Email
                </span>
                <input
                  type="email"
                  placeholder="jean@exemple.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  className="w-full h-12 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[15px] text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 focus:border-[#0a0a0a]/30 transition-all"
                />
              </label>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full h-12 rounded-full bg-[#0a0a0a] text-white font-semibold text-[15px] hover:bg-[#1d1d1f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  "Envoyer le lien"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-[13px] text-[#86868b]">
              Tu te souviens ?{" "}
              <Link
                href="/auth/login"
                className="text-[#1d1d1f] font-semibold hover:underline"
              >
                Retour
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
