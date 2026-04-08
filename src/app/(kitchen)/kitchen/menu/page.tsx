"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X as XIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MenuItemToggle {
  id: string;
  name: string;
  is_available: boolean;
  category_name: string;
}

export default function KitchenMenuPage() {
  const [items, setItems] = useState<MenuItemToggle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("menu_items")
        .select("id, name, is_available, categories(name)")
        .order("display_order");

      if (data) {
        setItems(
          data.map((d: Record<string, unknown>) => ({
            id: d.id as string,
            name: d.name as string,
            is_available: d.is_available as boolean,
            category_name: (d.categories as Record<string, string>)?.name || "",
          }))
        );
      }
      setLoading(false);
    }
    load();
  }, []);

  const toggle = async (id: string, current: boolean) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, is_available: !current } : i
      )
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: !current } as never)
      .eq("id", id);

    if (error) {
      // Revert
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, is_available: current } : i
        )
      );
      toast.error("Erreur de mise a jour");
    } else {
      toast.success(!current ? "Article disponible" : "Article indisponible");
    }
  };

  // Group by category
  const grouped = items.reduce(
    (acc, item) => {
      const cat = item.category_name || "Autre";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, MenuItemToggle[]>
  );

  return (
    <div className="h-dvh flex flex-col bg-[#0a0a12]">
      <header className="shrink-0 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/kitchen"
            className="text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-white">
            Gestion du menu
          </h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading && (
          <p className="text-white/20 text-center py-10">Chargement...</p>
        )}

        {Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="mb-6">
            <h2 className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3">
              {cat}
            </h2>
            <div className="space-y-1.5">
              {catItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <span
                    className={cn(
                      "text-sm font-medium",
                      item.is_available ? "text-white" : "text-white/30 line-through"
                    )}
                  >
                    {item.name}
                  </span>
                  <button
                    onClick={() => toggle(item.id, item.is_available)}
                    className={cn(
                      "h-8 w-14 rounded-full flex items-center px-1 cursor-pointer transition-colors",
                      item.is_available ? "bg-emerald-500" : "bg-white/10"
                    )}
                  >
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full bg-white flex items-center justify-center transition-transform",
                        item.is_available ? "translate-x-6" : "translate-x-0"
                      )}
                    >
                      {item.is_available ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <XIcon className="h-3 w-3 text-white/30" />
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
