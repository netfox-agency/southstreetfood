"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, AlertCircle, Clock, Ban, Check } from "lucide-react";
import { KitchenNav } from "@/components/kitchen/kitchen-nav";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import type { AvailabilityStatus } from "@/types/stock";
import { computeNextResetAt } from "@/types/stock";

/* ────────────────── Types ────────────────── */

export type Variant = {
  id: string;
  name: string;
  priceModifier: number;
  isAvailable: boolean;
  status: AvailabilityStatus;
  unavailableUntil: string | null;
};

export type Item = {
  id: string;
  name: string;
  basePrice: number;
  isAvailable: boolean;
  status: AvailabilityStatus;
  unavailableUntil: string | null;
  variants: Variant[];
};

export type CategoryWithItems = {
  id: string;
  name: string;
  items: Item[];
};

export type ExtraItem = {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  status: AvailabilityStatus;
  unavailableUntil: string | null;
};

export type ExtraGroup = {
  id: string;
  name: string;
  items: ExtraItem[];
};

export type Ingredient = {
  id: string;
  name: string;
  status: AvailabilityStatus;
  unavailableUntil: string | null;
};

type Entity = "menu_item" | "variant" | "extra_item" | "ingredient";
type Tab = "menu" | "ingredients";

/* ────────────────── Component ────────────────── */

export function MenuToggleClient({
  categories,
  extraGroups,
  ingredients,
  hideNav = false,
}: {
  categories: CategoryWithItems[];
  extraGroups: ExtraGroup[];
  ingredients: Ingredient[];
  /** Masque la KitchenNav (utile quand on reutilise le composant dans
   *  un autre shell comme /admin/stock). */
  hideNav?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [onlyUnavailable, setOnlyUnavailable] = useState(false);
  const [tab, setTab] = useState<Tab>("menu");
  // Optimistic overrides keyed by `${entity}:${id}` → {status, until}
  const [pending, setPending] = useState<
    Record<string, { status: AvailabilityStatus; until: string | null }>
  >({});
  const [isPending, startTransition] = useTransition();

  async function setStatus(
    entity: Entity,
    id: string,
    status: AvailabilityStatus,
  ) {
    const key = `${entity}:${id}`;
    const until =
      status === "unavailable_today" ? computeNextResetAt() : null;
    setPending((p) => ({ ...p, [key]: { status, until } }));
    try {
      const res = await fetch("/api/kitchen/menu/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity,
          id,
          status,
          unavailable_until: until,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur" }));
        throw new Error(err.error || "Erreur");
      }
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

  function getStatus(
    entity: Entity,
    id: string,
    storedStatus: AvailabilityStatus,
    storedUntil: string | null,
  ): { status: AvailabilityStatus; until: string | null } {
    const key = `${entity}:${id}`;
    return key in pending
      ? pending[key]
      : { status: storedStatus, until: storedUntil };
  }

  /* ─── Filter menu + extras ─── */

  const filteredCats = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories
      .map((cat) => {
        const items = cat.items.filter((i) => {
          if (q && !i.name.toLowerCase().includes(q)) return false;
          if (onlyUnavailable) {
            const cur = getStatus(
              "menu_item",
              i.id,
              i.status,
              i.unavailableUntil,
            );
            if (cur.status === "in_stock") return false;
          }
          return true;
        });
        return { ...cat, items };
      })
      .filter((c) => c.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, search, onlyUnavailable, pending]);

  const filteredExtras = useMemo(() => {
    const q = search.trim().toLowerCase();
    return extraGroups
      .map((g) => {
        const items = g.items.filter((i) => {
          if (q && !i.name.toLowerCase().includes(q)) return false;
          if (onlyUnavailable) {
            const cur = getStatus(
              "extra_item",
              i.id,
              i.status,
              i.unavailableUntil,
            );
            if (cur.status === "in_stock") return false;
          }
          return true;
        });
        return { ...g, items };
      })
      .filter((g) => g.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraGroups, search, onlyUnavailable, pending]);

  const filteredIngredients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ingredients.filter((ing) => {
      if (q && !ing.name.toLowerCase().includes(q)) return false;
      if (onlyUnavailable) {
        const cur = getStatus(
          "ingredient",
          ing.id,
          ing.status,
          ing.unavailableUntil,
        );
        if (cur.status === "in_stock") return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredients, search, onlyUnavailable, pending]);

  const unavailableCount = useMemo(() => {
    let n = 0;
    for (const c of categories) {
      for (const i of c.items) {
        const cur = getStatus("menu_item", i.id, i.status, i.unavailableUntil);
        if (cur.status !== "in_stock") n++;
      }
    }
    for (const g of extraGroups) {
      for (const i of g.items) {
        const cur = getStatus("extra_item", i.id, i.status, i.unavailableUntil);
        if (cur.status !== "in_stock") n++;
      }
    }
    for (const ing of ingredients) {
      const cur = getStatus(
        "ingredient",
        ing.id,
        ing.status,
        ing.unavailableUntil,
      );
      if (cur.status !== "in_stock") n++;
    }
    return n;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, extraGroups, ingredients, pending]);

  /* ─── Render ─── */

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-[#e5e5ea] px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-[#1d1d1f] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">SS</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-[#1d1d1f] truncate">Gestion stock</h1>
            <p className="text-xs text-[#86868b] truncate">
              {unavailableCount > 0
                ? `${unavailableCount} en rupture`
                : "Tout est disponible"}
            </p>
          </div>
        </div>

        {!hideNav && (
          <div className="hidden md:block">
            <KitchenNav />
          </div>
        )}

        <button
          onClick={() => startTransition(() => router.refresh())}
          className="h-10 w-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5ea] cursor-pointer"
          aria-label="Rafraichir"
        >
          <RefreshCw
            className={cn(
              "h-4 w-4 text-[#1d1d1f]",
              isPending && "animate-spin",
            )}
          />
        </button>
      </header>

      {/* Tabs (Menu vs Ingredients) */}
      <div className="shrink-0 bg-white border-b border-[#e5e5ea] px-5 pt-2 flex gap-1">
        {(
          [
            { key: "menu", label: "Articles" },
            { key: "ingredients", label: "Ingredients" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 cursor-pointer",
              tab === t.key
                ? "border-[#1d1d1f] text-[#1d1d1f]"
                : "border-transparent text-[#86868b] hover:text-[#1d1d1f]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="shrink-0 bg-white border-b border-[#e5e5ea] px-5 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b] pointer-events-none" />
          <input
            type="text"
            placeholder="Chercher..."
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
              : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e5e5ea]",
          )}
        >
          <AlertCircle className="h-4 w-4" />
          Ruptures uniquement
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-8">
        {tab === "menu" && (
          <>
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
                    const cur = getStatus(
                      "menu_item",
                      item.id,
                      item.status,
                      item.unavailableUntil,
                    );
                    return (
                      <div key={item.id}>
                        <div className="flex items-center justify-between px-4 py-3 gap-3">
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "font-semibold text-sm text-[#1d1d1f] truncate",
                                cur.status !== "in_stock" &&
                                  "line-through text-[#aeaeb2]",
                              )}
                            >
                              {item.name}
                            </p>
                            <div className="flex items-baseline gap-2">
                              <p className="text-xs text-[#86868b] tabular-nums">
                                {formatPrice(item.basePrice)}
                              </p>
                              <StatusSubline
                                status={cur.status}
                                until={cur.until}
                              />
                            </div>
                          </div>
                          <StatusSelector
                            status={cur.status}
                            onChange={(next) =>
                              setStatus("menu_item", item.id, next)
                            }
                          />
                        </div>
                        {item.variants.length > 0 &&
                          cur.status === "in_stock" && (
                            <div className="px-4 pb-3 pl-4 space-y-2">
                              {item.variants.map((v) => {
                                const vCur = getStatus(
                                  "variant",
                                  v.id,
                                  v.status,
                                  v.unavailableUntil,
                                );
                                return (
                                  <div
                                    key={v.id}
                                    className="flex items-center justify-between gap-3 pl-3 border-l-2 border-[#f0f0f2]"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p
                                        className={cn(
                                          "text-[13px] text-[#1d1d1f] truncate",
                                          vCur.status !== "in_stock" &&
                                            "line-through text-[#aeaeb2]",
                                        )}
                                      >
                                        {v.name}
                                      </p>
                                      <div className="flex items-baseline gap-2">
                                        {v.priceModifier !== 0 && (
                                          <p className="text-[11px] text-[#86868b] tabular-nums">
                                            {v.priceModifier > 0 ? "+" : ""}
                                            {formatPrice(v.priceModifier)}
                                          </p>
                                        )}
                                        <StatusSubline
                                          status={vCur.status}
                                          until={vCur.until}
                                          compact
                                        />
                                      </div>
                                    </div>
                                    <StatusSelector
                                      small
                                      status={vCur.status}
                                      onChange={(next) =>
                                        setStatus("variant", v.id, next)
                                      }
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
                  Supplements
                </h2>
                <div className="space-y-5">
                  {filteredExtras.map((g) => (
                    <div key={g.id}>
                      <p className="text-[13px] font-semibold text-[#1d1d1f] mb-2 px-1">
                        {g.name}
                      </p>
                      <div className="bg-white rounded-2xl border border-[#e5e5ea] divide-y divide-[#f0f0f2] overflow-hidden">
                        {g.items.map((ex) => {
                          const cur = getStatus(
                            "extra_item",
                            ex.id,
                            ex.status,
                            ex.unavailableUntil,
                          );
                          return (
                            <div
                              key={ex.id}
                              className="flex items-center justify-between px-4 py-3 gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <p
                                  className={cn(
                                    "text-sm text-[#1d1d1f] truncate",
                                    cur.status !== "in_stock" &&
                                      "line-through text-[#aeaeb2]",
                                  )}
                                >
                                  {ex.name}
                                </p>
                                <div className="flex items-baseline gap-2">
                                  <p className="text-xs text-[#86868b] tabular-nums">
                                    +{formatPrice(ex.price)}
                                  </p>
                                  <StatusSubline
                                    status={cur.status}
                                    until={cur.until}
                                  />
                                </div>
                              </div>
                              <StatusSelector
                                status={cur.status}
                                onChange={(next) =>
                                  setStatus("extra_item", ex.id, next)
                                }
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
          </>
        )}

        {tab === "ingredients" && (
          <>
            {filteredIngredients.length === 0 && (
              <div className="text-center py-20">
                <p className="text-sm text-[#86868b]">
                  Aucun ingredient
                  {ingredients.length === 0 && " (creer depuis /admin/ingredients)"}
                </p>
              </div>
            )}
            {filteredIngredients.length > 0 && (
              <section>
                <h2 className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-3 px-1">
                  Ingredients ({filteredIngredients.length})
                </h2>
                <p className="text-xs text-[#86868b] mb-3 px-1">
                  Passer un ingredient en rupture desactive automatiquement
                  tous les articles qui l&apos;utilisent sur la carte client.
                </p>
                <div className="bg-white rounded-2xl border border-[#e5e5ea] divide-y divide-[#f0f0f2] overflow-hidden">
                  {filteredIngredients.map((ing) => {
                    const cur = getStatus(
                      "ingredient",
                      ing.id,
                      ing.status,
                      ing.unavailableUntil,
                    );
                    return (
                      <div
                        key={ing.id}
                        className="flex items-center justify-between px-4 py-3 gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-sm text-[#1d1d1f] truncate font-medium",
                              cur.status !== "in_stock" &&
                                "line-through text-[#aeaeb2]",
                            )}
                          >
                            {ing.name}
                          </p>
                          <StatusSubline
                            status={cur.status}
                            until={cur.until}
                          />
                        </div>
                        <StatusSelector
                          status={cur.status}
                          onChange={(next) =>
                            setStatus("ingredient", ing.id, next)
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ────────────────── Sub-components ────────────────── */

/**
 * Sous-ligne qui affiche le statut en texte, et "retour vers Xh" pour
 * les items passes en 'unavailable_today' avec date de retour calculee.
 */
function StatusSubline({
  status,
  until,
  compact = false,
}: {
  status: AvailabilityStatus;
  until: string | null;
  compact?: boolean;
}) {
  if (status === "in_stock") return null;
  const textClass = cn(
    "text-[11px]",
    compact ? "text-[#aeaeb2]" : "text-amber-600",
  );
  if (status === "unavailable_today" && until) {
    const date = new Date(until);
    const fmt = new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    }).format(date);
    return (
      <span className={textClass}>
        Retour {fmt}
      </span>
    );
  }
  if (status === "unavailable_today") {
    return <span className={textClass}>Indispo aujourd&apos;hui</span>;
  }
  return (
    <span className="text-[11px] text-red-600">Indispo (indeterminee)</span>
  );
}

/**
 * Selecteur 3-etats :
 *   ✓ (vert)     = in_stock
 *   🕒 (orange)  = unavailable_today
 *   ⛔ (rouge)   = unavailable_indefinite
 *
 * 3 mini-boutons visuellement connectes en un "segmented control".
 */
function StatusSelector({
  status,
  onChange,
  small = false,
}: {
  status: AvailabilityStatus;
  onChange: (next: AvailabilityStatus) => void;
  small?: boolean;
}) {
  const size = small ? "h-8 w-8" : "h-9 w-9";
  const icon = small ? "h-3.5 w-3.5" : "h-4 w-4";
  const states: {
    key: AvailabilityStatus;
    label: string;
    Icon: typeof Check;
    activeCls: string;
  }[] = [
    {
      key: "in_stock",
      label: "En stock",
      Icon: Check,
      activeCls: "bg-emerald-500 text-white",
    },
    {
      key: "unavailable_today",
      label: "Indispo aujourd'hui",
      Icon: Clock,
      activeCls: "bg-amber-500 text-white",
    },
    {
      key: "unavailable_indefinite",
      label: "Indispo",
      Icon: Ban,
      activeCls: "bg-red-500 text-white",
    },
  ];
  return (
    <div
      className="inline-flex shrink-0 rounded-full bg-[#f5f5f7] p-0.5 gap-0.5"
      role="radiogroup"
    >
      {states.map((s) => {
        const active = status === s.key;
        return (
          <button
            key={s.key}
            role="radio"
            aria-checked={active}
            aria-label={s.label}
            title={s.label}
            onClick={() => onChange(s.key)}
            className={cn(
              "rounded-full flex items-center justify-center transition-colors cursor-pointer",
              size,
              active
                ? s.activeCls
                : "text-[#86868b] hover:bg-[#e5e5ea]",
            )}
          >
            <s.Icon className={icon} />
          </button>
        );
      })}
    </div>
  );
}
