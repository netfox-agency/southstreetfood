"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erreur de deconnexion");
      setLoading(false);
      return;
    }
    toast.success("Deconnecte");
    router.push("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="w-full h-12 rounded-2xl border border-[#e5e5ea] bg-white text-[#1d1d1f] font-semibold text-[14px] hover:bg-[#f5f5f7] transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Se deconnecter
    </button>
  );
}
