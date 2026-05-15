"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Gift,
  Check,
  X,
  Save,
  TrendingUp,
  Lock,
  ChefHat,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Tier {
  id: string;
  tierLevel: number;
  name: string;
  description: string;
  pointsCost: number;
  slots: {
    main: boolean;
    fries: boolean;
    drink: boolean;
    dessert: boolean;
  };
  mainCategories: string[];
  excludedSlugs: string[];
  isActive: boolean;
  redemptions30d: number;
}

interface EligibleItem {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
}

export function LoyaltyAdminClient({
  tiers,
  eligibleItems,
}: {
  tiers: Tier[];
  eligibleItems: EligibleItem[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<Tier>>>({});
  const [pending, startTransition] = useTransition();

  const updateDraft = (id: string, patch: Partial<Tier>) => {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
  };

  const saveTier = async (tier: Tier) => {
    const draft = drafts[tier.id];
    if (!draft) {
      setEditing(null);
      return;
    }

    const body: Record<string, unknown> = { id: tier.id };
    if (draft.description !== undefined) body.description = draft.description;
    if (draft.pointsCost !== undefined) body.pointsCost = draft.pointsCost;
    if (draft.isActive !== undefined) body.isActive = draft.isActive;
    if (draft.excludedSlugs !== undefined)
      body.excludedSlugs = draft.excludedSlugs;

    const res = await fetch("/api/admin/loyalty/tiers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erreur" }));
      toast.error(err.error || "Echec de la sauvegarde");
      return;
    }

    toast.success(`Palier ${tier.tierLevel} mis a jour`);
    setEditing(null);
    setDrafts((d) => {
      const next = { ...d };
      delete next[tier.id];
      return next;
    });
    startTransition(() => router.refresh());
  };

  const totalRedemptions = tiers.reduce(
    (sum, t) => sum + t.redemptions30d,
    0,
  );
  const activeTiers = tiers.filter((t) => t.isActive).length;

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="h-4 w-4 text-[#e8416f]" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#e8416f]">
            South Street Rewards
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1d1d1f]">
          Programme fidelite
        </h1>
        <p className="mt-1 text-[#86868b]">
          Gestion des 6 paliers, regles d&apos;eligibilite, et stats
          redemptions.
        </p>
      </div>

      {/* Stats top row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <StatCard
          icon={Gift}
          label="Paliers actifs"
          value={`${activeTiers} / ${tiers.length}`}
        />
        <StatCard
          icon={TrendingUp}
          label="Redemptions (30j)"
          value={String(totalRedemptions)}
        />
        <StatCard
          icon={ChefHat}
          label="Regle de base"
          value="1€ = 1 point"
        />
      </div>

      {/* Tiers list */}
      <div className="space-y-3">
        {tiers.map((tier) => {
          const draft = drafts[tier.id] ?? {};
          const isEditing = editing === tier.id;
          const draftedTier = { ...tier, ...draft } as Tier;

          return (
            <div
              key={tier.id}
              className={cn(
                "rounded-2xl border bg-white transition-all",
                tier.isActive
                  ? "border-[#e5e5ea]"
                  : "border-[#e5e5ea] bg-[#fafafa] opacity-70",
                isEditing && "border-[#e8416f]/40 shadow-[0_12px_32px_-12px_rgba(232,65,111,0.2)]",
              )}
            >
              {/* Header row */}
              <div className="flex items-center gap-4 p-5">
                <div
                  className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                    tier.isActive
                      ? "bg-[#e8416f] text-white"
                      : "bg-[#f5f5f7] text-[#86868b]",
                  )}
                >
                  <span className="text-lg font-bold tabular-nums">
                    {tier.tierLevel}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={draftedTier.description}
                        onChange={(e) =>
                          updateDraft(tier.id, {
                            description: e.target.value,
                          })
                        }
                        className="w-full text-[15px] font-semibold text-[#1d1d1f] bg-transparent border-b border-[#e8416f]/30 focus:border-[#e8416f] outline-none pb-1"
                        placeholder="Description du palier"
                      />
                      <div className="mt-2 flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-[12px] text-[#86868b]">
                          <span>Cout :</span>
                          <input
                            type="number"
                            min={1}
                            max={10000}
                            value={draftedTier.pointsCost}
                            onChange={(e) =>
                              updateDraft(tier.id, {
                                pointsCost: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-20 px-2 py-1 rounded-md border border-[#e5e5ea] text-[12px] tabular-nums text-[#1d1d1f] focus:border-[#e8416f] outline-none"
                          />
                          <span>pts</span>
                        </label>
                        <label className="flex items-center gap-2 text-[12px] text-[#86868b] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draftedTier.isActive}
                            onChange={(e) =>
                              updateDraft(tier.id, {
                                isActive: e.target.checked,
                              })
                            }
                            className="rounded accent-[#e8416f]"
                          />
                          Actif
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] font-semibold text-[#1d1d1f]">
                          {tier.description}
                        </p>
                        {!tier.isActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[10px] font-bold text-[#86868b]">
                            <Lock className="h-2.5 w-2.5" />
                            Inactif
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[12px] text-[#86868b]">
                        <span className="font-medium tabular-nums">
                          {tier.pointsCost} pts
                        </span>
                        <span>·</span>
                        <SlotsBadge slots={tier.slots} />
                        <span>·</span>
                        <span className="tabular-nums">
                          {tier.redemptions30d} util. / 30j
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setEditing(null);
                          setDrafts((d) => {
                            const next = { ...d };
                            delete next[tier.id];
                            return next;
                          });
                        }}
                        className="h-9 w-9 rounded-full hover:bg-[#f5f5f7] flex items-center justify-center transition-colors"
                        aria-label="Annuler"
                      >
                        <X className="h-4 w-4 text-[#86868b]" />
                      </button>
                      <button
                        onClick={() => saveTier(tier)}
                        disabled={pending}
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#e8416f] text-white text-[13px] font-semibold hover:bg-[#d13a63] disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Sauvegarder
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditing(tier.id)}
                      className="h-9 px-4 rounded-full border border-[#e5e5ea] text-[13px] font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors cursor-pointer"
                    >
                      Modifier
                    </button>
                  )}
                </div>
              </div>

              {/* Exclusions editor (only when editing AND tier has slot_main) */}
              {isEditing && tier.slots.main && (
                <div className="px-5 pb-5 pt-2 border-t border-[#e5e5ea]">
                  <p className="text-[12px] font-semibold text-[#1d1d1f] mb-2">
                    Items exclus de ce palier (slot sandwich)
                  </p>
                  <p className="text-[11px] text-[#86868b] mb-3">
                    Coche les items que tu NE veux PAS offrir a ce palier.
                    Typiquement : Montagnard / 180 / XL pour les paliers 3-5,
                    rien pour le palier 6.
                  </p>
                  <ExclusionsPicker
                    items={eligibleItems}
                    selected={
                      draftedTier.excludedSlugs ?? tier.excludedSlugs
                    }
                    onChange={(slugs) =>
                      updateDraft(tier.id, { excludedSlugs: slugs })
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="mt-8 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] p-5">
        <p className="text-[12px] text-[#86868b] leading-relaxed">
          <span className="font-semibold text-[#1d1d1f]">
            Slots non modifiables
          </span>{" "}
          : la structure de chaque palier (sandwich / frites / boisson /
          dessert) est figee par la migration DB pour garantir la coherence
          avec la PG function de validation. Pour changer ces fondations,
          contacte le dev (creation d&apos;une nouvelle migration).
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e5e5ea] bg-white p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-[#fff5f8] flex items-center justify-center">
        <Icon className="h-5 w-5 text-[#e8416f]" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#86868b]">
          {label}
        </p>
        <p className="text-lg font-bold text-[#1d1d1f] tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

function SlotsBadge({ slots }: { slots: Tier["slots"] }) {
  const items: string[] = [];
  if (slots.main) items.push("sandwich");
  if (slots.fries) items.push("frites");
  if (slots.drink) items.push("boisson");
  if (slots.dessert) items.push("dessert");
  return <span>{items.join(" + ")}</span>;
}

function ExclusionsPicker({
  items,
  selected,
  onChange,
}: {
  items: EligibleItem[];
  selected: string[];
  onChange: (slugs: string[]) => void;
}) {
  const selSet = new Set(selected);
  const toggle = (slug: string) => {
    const next = new Set(selSet);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    onChange([...next]);
  };

  // Groupe par categorie
  const byCat = new Map<string, EligibleItem[]>();
  for (const item of items) {
    const list = byCat.get(item.categoryName) ?? [];
    list.push(item);
    byCat.set(item.categoryName, list);
  }

  return (
    <div className="space-y-3">
      {[...byCat.entries()].map(([cat, list]) => (
        <div key={cat}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] mb-1.5">
            {cat}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {list.map((item) => {
              const isExcluded = selSet.has(item.slug);
              return (
                <button
                  key={item.id}
                  onClick={() => toggle(item.slug)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                    isExcluded
                      ? "bg-[#e8416f] text-white border-[#e8416f]"
                      : "bg-white text-[#1d1d1f] border-[#e5e5ea] hover:border-[#aeaeb2]",
                  )}
                >
                  {isExcluded && <Check className="h-2.5 w-2.5" />}
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
