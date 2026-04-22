"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { LOYALTY } from "@/lib/constants";

function SignupInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/fidelite";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Mot de passe : 6 caracteres minimum");
      return;
    }
    if (phone.replace(/\s/g, "").length < 10) {
      toast.error("Numero de telephone invalide");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // Ces champs atterrissent dans auth.users.raw_user_meta_data
          // puis sont copies dans profiles via le trigger handle_new_user.
          // Le trigger grant_welcome_bonus fire juste apres et credite
          // +50 pts au nouveau compte.
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}${redirectTo}`
              : undefined,
        },
      });

      if (error) {
        toast.error(
          error.message.includes("already registered")
            ? "Un compte existe deja avec cet email"
            : "Erreur : " + error.message,
        );
        setLoading(false);
        return;
      }

      toast.success(`Bienvenue ! ${LOYALTY.welcomeBonus} points offerts`);
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
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#0a0a0a] text-white px-3 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#e8416f]" />
          <span className="text-[11px] font-semibold tracking-wider uppercase">
            {LOYALTY.welcomeBonus} points offerts
          </span>
        </div>

        <h1 className="font-display text-5xl sm:text-6xl text-[#1d1d1f] tracking-tight leading-[0.95] mb-2">
          Bienvenue.
        </h1>
        <p className="text-[14px] sm:text-base text-[#86868b] mb-8">
          Cree ton compte et commence a cumuler des points des ta premiere
          commande.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Nom complet"
            type="text"
            placeholder="Jean Dupont"
            value={fullName}
            onChange={setFullName}
            required
            autoComplete="name"
          />
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
            label="Telephone"
            type="tel"
            placeholder="06 12 34 56 78"
            value={phone}
            onChange={setPhone}
            required
            autoComplete="tel"
          />
          <Field
            label="Mot de passe"
            type="password"
            placeholder="6 caracteres minimum"
            value={password}
            onChange={setPassword}
            required
            autoComplete="new-password"
            minLength={6}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-[#0a0a0a] text-white font-semibold text-[15px] hover:bg-[#1d1d1f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "Creer mon compte"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-[#86868b]">
          Deja un compte ?{" "}
          <Link
            href={`/auth/login${redirectTo !== "/fidelite" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="text-[#1d1d1f] font-semibold hover:underline"
          >
            Se connecter
          </Link>
        </p>

        <p className="mt-6 text-center text-[11px] text-[#aeaeb2] leading-relaxed">
          En creant ton compte, tu acceptes nos{" "}
          <Link href="/cgv" className="underline hover:text-[#86868b]">
            CGV
          </Link>{" "}
          et notre{" "}
          <Link
            href="/confidentialite"
            className="underline hover:text-[#86868b]"
          >
            politique de confidentialite
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SignupInner />
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
  minLength,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
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
        minLength={minLength}
        className="w-full h-12 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-[15px] text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 focus:border-[#0a0a0a]/30 transition-all"
      />
    </label>
  );
}
