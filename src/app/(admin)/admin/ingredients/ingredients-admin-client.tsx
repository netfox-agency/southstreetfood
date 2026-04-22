"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AvailabilityStatus } from "@/types/stock";

/* ────────── Types ────────── */

type Ingredient = {
  id: string;
  name: string;
  status: AvailabilityStatus;
  unavailableUntil: string | null;
  displayOrder: number;
  menuItemIds: string[];
  extraIds: string[];
};

type RefItem = { id: string; name: string };

type EditPayload = {
  name?: string;
  display_order?: number;
  menuItemIds?: string[];
  extraIds?: string[];
};

/* ────────── Component ────────── */

export function IngredientsAdminClient({
  ingredients,
  menuItems,
  extras,
}: {
  ingredients: Ingredient[];
  menuItems: RefItem[];
  extras: RefItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter((ing) =>
      ing.name.toLowerCase().includes(q),
    );
  }, [ingredients, search]);

  async function saveIngredient(
    id: string | null,
    payload: EditPayload & { name: string },
  ) {
    const url = id ? `/api/admin/ingredients/${id}` : "/api/admin/ingredients";
    const method = id ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erreur" }));
      throw new Error(err.error || "Erreur");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer l'ingredient "${name}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/ingredients/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur" }));
        throw new Error(err.error || "Erreur");
      }
      toast.success(`${name} supprime`);
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ingredients</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Chaque ingredient lie a des articles. Passer un ingredient en
              rupture desactive tous les articles qui l&apos;utilisent sur la
              carte client.
            </p>
          </div>
          <button
            onClick={() => {
              setCreating(true);
              setEditingId(null);
            }}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nouvel ingredient
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Chercher un ingredient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-full bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {filtered.length} ingredient{filtered.length > 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-border p-10 text-center">
            <p className="text-muted-foreground">
              {ingredients.length === 0
                ? "Aucun ingredient. Cliquer sur 'Nouvel ingredient' ou lancer"
                : "Aucun resultat"}
            </p>
            {ingredients.length === 0 && (
              <code className="inline-block mt-2 px-3 py-1 bg-muted text-xs rounded">
                node scripts/seed-ingredients.mjs
              </code>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="bg-white rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {filtered.map((ing) => (
              <div
                key={ing.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <StatusDot status={ing.status} />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {ing.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lie a {ing.menuItemIds.length} article
                      {ing.menuItemIds.length !== 1 ? "s" : ""}
                      {ing.extraIds.length > 0 &&
                        ` · ${ing.extraIds.length} extra${ing.extraIds.length !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingId(ing.id);
                      setCreating(false);
                    }}
                    className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center cursor-pointer"
                    aria-label="Editer"
                  >
                    <Pencil className="h-4 w-4 text-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(ing.id, ing.name)}
                    className="h-9 w-9 rounded-full hover:bg-red-50 flex items-center justify-center cursor-pointer"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          {isPending && "Rafraichissement..."}
        </p>
      </div>

      {(creating || editingId) && (
        <IngredientEditor
          ingredient={
            editingId ? ingredients.find((i) => i.id === editingId) : null
          }
          menuItems={menuItems}
          extras={extras}
          onClose={() => {
            setCreating(false);
            setEditingId(null);
          }}
          onSave={async (payload) => {
            try {
              await saveIngredient(editingId, payload);
              toast.success(editingId ? "Modifie" : "Cree");
              setCreating(false);
              setEditingId(null);
              startTransition(() => router.refresh());
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : "Erreur");
            }
          }}
        />
      )}
    </div>
  );
}

/* ────────── Sub-components ────────── */

function StatusDot({ status }: { status: AvailabilityStatus }) {
  const cls =
    status === "in_stock"
      ? "bg-emerald-500"
      : status === "unavailable_today"
        ? "bg-amber-500"
        : "bg-red-500";
  const label =
    status === "in_stock"
      ? "En stock"
      : status === "unavailable_today"
        ? "Indispo aujourd'hui"
        : "Indispo indeterminee";
  return (
    <span
      className={cn("h-2.5 w-2.5 rounded-full shrink-0", cls)}
      title={label}
    />
  );
}

function IngredientEditor({
  ingredient,
  menuItems,
  extras,
  onClose,
  onSave,
}: {
  ingredient: Ingredient | null | undefined;
  menuItems: RefItem[];
  extras: RefItem[];
  onClose: () => void;
  onSave: (payload: EditPayload & { name: string }) => void | Promise<void>;
}) {
  const [name, setName] = useState(ingredient?.name ?? "");
  const [displayOrder, setDisplayOrder] = useState(
    ingredient?.displayOrder ?? 0,
  );
  const [linkedMenuIds, setLinkedMenuIds] = useState<Set<string>>(
    new Set(ingredient?.menuItemIds ?? []),
  );
  const [linkedExtraIds, setLinkedExtraIds] = useState<Set<string>>(
    new Set(ingredient?.extraIds ?? []),
  );
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredMenu = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter((m) => m.name.toLowerCase().includes(q));
  }, [menuItems, search]);

  const filteredExtras = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return extras;
    return extras.filter((e) => e.name.toLowerCase().includes(q));
  }, [extras, search]);

  const toggleMenu = (id: string) => {
    setLinkedMenuIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleExtra = (id: string) => {
    setLinkedExtraIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nom obligatoire");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        display_order: displayOrder,
        menuItemIds: Array.from(linkedMenuIds),
        extraIds: Array.from(linkedExtraIds),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden"
      >
        <div className="shrink-0 flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            {ingredient ? "Editer ingredient" : "Nouvel ingredient"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center cursor-pointer"
          >
            <X className="h-4 w-4 text-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Nom */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bacon, Raclette, Steak 180g..."
              className="w-full h-11 px-4 rounded-xl bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
              maxLength={80}
            />
          </div>

          {/* Ordre */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Ordre d&apos;affichage (plus petit = plus haut)
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              min={0}
              max={9999}
              className="w-32 h-11 px-4 rounded-xl bg-muted border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Warning sur les liens */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Cocher ci-dessous les articles et extras qui utilisent cet
              ingredient. Quand tu marques l&apos;ingredient en rupture, tous
              ceux-ci deviennent indisponibles sur la carte client.
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Filtrer articles + extras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-full bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Menu items */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2">
              Articles ({linkedMenuIds.size} coches sur {menuItems.length})
            </h3>
            <div className="border border-border rounded-xl max-h-60 overflow-y-auto divide-y divide-border">
              {filteredMenu.map((item) => {
                const checked = linkedMenuIds.has(item.id);
                return (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMenu(item.id)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-foreground truncate">
                      {item.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Extras */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2">
              Extras ({linkedExtraIds.size} coches sur {extras.length})
            </h3>
            <div className="border border-border rounded-xl max-h-60 overflow-y-auto divide-y divide-border">
              {filteredExtras.map((extra) => {
                const checked = linkedExtraIds.has(extra.id);
                return (
                  <label
                    key={extra.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleExtra(extra.id)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-foreground truncate">
                      {extra.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="shrink-0 flex justify-end gap-2 p-5 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {saving ? "..." : ingredient ? "Enregistrer" : "Creer"}
          </button>
        </div>
      </form>
    </div>
  );
}
