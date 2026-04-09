"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, AlertCircle } from "lucide-react";
import { KitchenNav } from "@/components/kitchen/kitchen-nav";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export type Variant = {
  id: string;
  name: string;
  priceModifier: number;
  isAvailable: boolean;
};

export type Item = {
  id: string;
  name: string;
  basePrice: number;
  isAvailable: boolean;
  variants: Variant[];
};

export type CategoryWithItems = {
  id: string;
  name: string;
  items: Item[];
};

type ExtraItem = {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
};

type ExtraGroup = {
  id: string;
  name: string;
  items: ExtraItem[];
};

type Entity = "menu_item" | "variant" | "extra_item";

export function MenuToggleClient({
  categories,
  extraGroups,
}: {
  categories: CategoryWithItems[];
  extraGroups: ExtraGroup[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [onlyUnavailable, setOnlyUnavailable] = useState(false);
  // Optimistic overrides: `${entity}:${id}` -> bool
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  async function toggle(entity: Entity, id: string, next: boolean) {
    const key = `${entity}:${id}`;
    setPending((p) => ({ ...p, [key]: next }));
    try {
      const res = await fetch("/api/kitchen/menu/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, id, isAvailable: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur" }));
        throw new Error(err.error || "Erreur");
      }
      // Revalidate server data so the next refresh mirrors the DB
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erreur";
      toast.error(message);
      setPending((p) => {
        const copy = { ...p };
        delete copy[key];
        return copy;
      });
    }
  }

  function isAvail(entity: Entity, id: string, stored: boolean): boolean {
    const key = `${entity}:${id}`;
    return key in pending ? pending[key] : stored;
  }

  const filteredCats = useMemo(() => {
    const q = search.trim().toLowerCase();
    const check = (entity: Entity, id: string, stored: boolean) => {
      const key = `${entity}:${id}`;
      return key in pending ? pending[key] : stored;
    };
    return categories
      .map((cat) => {
        const items = cat.items.filter((i) => {
          if (q && !i.name.toLowerCase().includes(q)) return false;
          if (onlyUnavailable && check("menu_item", i.id, i.isAvailable)) return false;
          return true;
        });
        return { ...cat, items };
      })
      .filter((c) => c.items.length > 0);
  }, [categories, search, onlyUnavailable, pending]);

  const filteredExtras = useMemo(() => {
    const q = search.trim().toLowerCase();
    const check = (entity: Entity, id: string, stored: boolean) => {
      const key = `${entity}:${id}`;
      return key in pending ? pending[key] : stored;
    };
    return extraGroups
      .map((g) => {
        const items = g.items.filter((i) => {
          if (q && !i.name.toLowerCase().includes(q)) return false;
          if (onlyUnavailable && check("extra_item", i.id, i.isAvailable)) return false;
          return true;
        });
        return { ...g, items };
      })
      .filter((g) => g.items.length > 0);
  }, [extraGroups, search, onlyUnavailable, pending]);

  const unavailableCount = useMemo(() => {
    const check = (entity: Entity, id: string, stored: boolean) => {
      const key = `${entity}:${id}`;
      return key in pending ? pending[key] : stored;
    };
    let n = 0;
    for (const c of categories) {
      for (const i of c.items) if (!check("menu_item", i.id, i.isAvailable)) n++;
    }
    for (const g of extraGroups) {
      for (const i of g.items) if (!check("extra_item", i.id, i.isAvailable)) n++;
    }
    return n;
  }, [categories, extraGroups, pending]);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-[#e5e5ea] px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-[#1d1d1f] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">SS</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-[#1d1d1f] truncate">Menu</h1>
            <p className="text-xs text-[#86868b] truncate">
              {unavailableCount > 0
                ? `${unavailableCount} en rupture`
                : "Tout est disponible"}
            </p>
          </div>
        </div>

        <div className="hidden md:block">
          <KitchenNav />
        </div>

        <button
          onClick={() => startTransition(() => router.refresh())}
          className="h-10 w-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5ea] cursor-pointer"
          aria-label="Rafraîchir"
        >
          <RefreshCw className={cn("h-4 w-4 text-[#1d1d1f]", isPending && "animate-spin")} />
        </button>
      </header>

      {/* Filters */}
      <div className="shrink-0 bg-white border-b border-[#e5e5ea] px-5 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b] pointer-events-none" />
          <input
            type="text"
            placeholder="Chercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-full bg-[#f5f5f7] border-0 text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10"
          />
        </div>
        <button
          onClick={() => setOnlyUnavailable((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-semibold transition-all cursor-pointer",
            onlyUnavailable
              ? "bg-red-500 text-white"
              : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea]"
          )}
        >
          <AlertCircle className="h-4 w-4" />
          Ruptures uniquement
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-8">
        {filteredCats.length === 0 && filteredExtras.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm text-[#86868b]">Aucun produit</p>
          </div>
        )}

        {filteredCats.map((cat) => (
          <section key={cat.id}>
            <h2 className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-3 px-1">
              {cat.name}
            </h2>
            <div className="bg-white rounded-2xl border border-[#e5e5ea] divide-y divide-[#f0f0f2] overflow-hidden">
              {cat.items.map((item) => {
                const avail = isAvail("menu_item", item.id, item.isAvailable);
                return (
                  <div key={item.id}>
                    <div className="flex items-center justify-between px-4 py-3 gap-3">
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "font-semibold text-sm text-[#1d1d1f] truncate",
                            !avail && "line-through text-[#aeaeb2]"
                          )}
                        >
                          {item.name}
                        </p>
                        <p className="text-xs text-[#86868b] tabular-nums">
                          {formatPrice(item.basePrice)}
                        </p>
                      </div>
                      <Toggle
                        checked={avail}
                        onChange={(next) => toggle("menu_item", item.id, next)}
                      />
                    </div>
                    {item.variants.length > 0 && avail && (
                      <div className="px-4 pb-3 pl-4 space-y-2">
                        {item.variants.map((v) => {
                          const vAvail = isAvail("variant", v.id, v.isAvailable);
                          return (
                            <div
                              key={v.id}
                              className="flex items-center justify-between gap-3 pl-3 border-l-2 border-[#f0f0f2]"
                            >
                              <div className="min-w-0">
                                <p
                                  className={cn(
                                    "text-[13px] text-[#1d1d1f] truncate",
                                    !vAvail && "line-through text-[#aeaeb2]"
                                  )}
                                >
                                  {v.name}
                                </p>
                                {v.priceModifier !== 0 && (
                                  <p className="text-[11px] text-[#86868b] tabular-nums">
                                    {v.priceModifier > 0 ? "+" : ""}
                                    {formatPrice(v.priceModifier)}
                                  </p>
                                )}
                              </div>
                              <Toggle
                                small
                                checked={vAvail}
                                onChange={(next) => toggle("variant", v.id, next)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {filteredExtras.length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-3 px-1">
              Suppléments
            </h2>
            <div className="space-y-5">
              {filteredExtras.map((g) => (
                <div key={g.id}>
                  <p className="text-[13px] font-semibold text-[#1d1d1f] mb-2 px-1">
                    {g.name}
                  </p>
                  <div className="bg-white rounded-2xl border border-[#e5e5ea] divide-y divide-[#f0f0f2] overflow-hidden">
                    {g.items.map((ex) => {
                      const avail = isAvail("extra_item", ex.id, ex.isAvailable);
                      return (
                        <div
                          key={ex.id}
                          className="flex items-center justify-between px-4 py-3 gap-3"
                        >
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "text-sm text-[#1d1d1f] truncate",
                                !avail && "line-through text-[#aeaeb2]"
                              )}
                            >
                              {ex.name}
                            </p>
                            <p className="text-xs text-[#86868b] tabular-nums">
                              +{formatPrice(ex.price)}
                            </p>
                          </div>
                          <Toggle
                            checked={avail}
                            onChange={(next) => toggle("extra_item", ex.id, next)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  small = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  small?: boolean;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className={cn(
        "relative shrink-0 rounded-full transition-colors cursor-pointer",
        small ? "h-6 w-10" : "h-7 w-12",
        checked ? "bg-emerald-500" : "bg-[#e5e5ea]"
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-all",
          small
            ? "h-5 w-5 left-0.5"
            : "h-6 w-6 left-0.5",
          checked && (small ? "translate-x-4" : "translate-x-5")
        )}
      />
    </button>
  );
}
