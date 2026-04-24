"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/fidelite";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error(
          error.message.includes("Invalid login")
            ? "Email ou mot de passe incorrect"
            : "Erreur : " + error.message,
        );
        setLoading(false);
        return;
      }

      toast.success("Connecte !");
      router.push(redirectTo);
      router.refresh();
    } catch {
      toast.error("Erreur inattendue");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-md px-5 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>
      </div>

      <div className="mx-auto max-w-md px-5 py-10">
        <h1 className="font-display text-5xl sm:text-6xl text-[#1d1d1f] tracking-tight leading-[0.95] mb-2">
          Connexion.
        </h1>
        <p className="text-[14px] sm:text-base text-[#86868b] mb-8">
          Accede a ton solde de points et tes recompenses.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Email"
            type="email"
            placeholder="jean@exemple.fr"
            value={email}
            onChange={setEmail}
            required
            autoComplete="email"
          />
          <Field
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            required
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-[#0a0a0a] text-white font-semibold text-[15px] hover:bg-[#1d1d1f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "Se connecter"
            )}
          </button>

          <div className="text-center">
            <Link
              href="/auth/forgot-password"
              className="text-[12px] text-[#86868b] hover:text-[#1d1d1f] hover:underline transition-colors"
            >
              Mot de passe oublie ?
            </Link>
          </div>
        </form>

        <p className="mt-6 text-center text-[13px] text-[#86868b]">
          Pas encore de compte ?{" "}
          <Link
            href={`/auth/signup${redirectTo !== "/fidelite" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="text-[#1d1d1f] font-semibold hover:underline"
          >
            Creer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginInner />
    </Suspense>
  );
}

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
  required,
  autoComplete,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-[#86868b] mb-1.5 block">
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="w-full h-12 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[15px] text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 focus:border-[#0a0a0a]/30 transition-all"
      />
    </label>
  );
}
