"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Search,
  Upload,
  X,
  Loader2,
  Check,
  ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
}

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " \u20ac";
}

export function MenuAdminClient({
  categories,
  items: initialItems,
}: {
  categories: Category[];
  items: MenuItem[];
}) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const filtered = items.filter((item) => {
    if (activeCategory !== "all" && item.category_id !== activeCategory) {
      return false;
    }
    if (
      search.trim() &&
      !item.name.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const toggleAvailability = async (item: MenuItem) => {
    const supabase = createClient();
    const newValue = !item.is_available;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_available: newValue } : i))
    );

    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: newValue } as never)
      .eq("id", item.id);

    if (error) {
      // Rollback
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_available: !newValue } : i
        )
      );
      toast.error("Echec de la mise a jour");
    } else {
      toast.success(
        newValue ? `${item.name} active` : `${item.name} desactive`
      );
    }
  };

  const toggleFeatured = async (item: MenuItem) => {
    const supabase = createClient();
    const newValue = !item.is_featured;

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_featured: newValue } : i))
    );

    const { error } = await supabase
      .from("menu_items")
      .update({ is_featured: newValue } as never)
      .eq("id", item.id);

    if (error) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_featured: !newValue } : i
        )
      );
      toast.error("Echec");
    }
  };

  const handleImageUpdated = (itemId: string, newUrl: string | null) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, image_url: newUrl } : i))
    );
    if (editingItem?.id === itemId) {
      setEditingItem({ ...editingItem, image_url: newUrl });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">
            Menu
          </h1>
          <p className="mt-1 text-sm text-[#86868b]">
            {items.length} produits · {items.filter((i) => i.is_available).length}{" "}
            disponibles
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-[#e5e5ea] text-sm placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer",
            activeCategory === "all"
              ? "bg-[#1d1d1f] text-white"
              : "bg-white border border-[#e5e5ea] text-[#1d1d1f] hover:bg-[#f5f5f7]"
          )}
        >
          Tous
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer",
              activeCategory === cat.id
                ? "bg-[#1d1d1f] text-white"
                : "bg-white border border-[#e5e5ea] text-[#1d1d1f] hover:bg-[#f5f5f7]"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={cn(
              "bg-white rounded-2xl border border-[#e5e5ea] overflow-hidden hover:border-[#1d1d1f]/15 transition-colors cursor-pointer",
              !item.is_available && "opacity-60"
            )}
            onClick={() => setEditingItem(item)}
          >
            <div className="relative aspect-[16/10] bg-[#f5f5f7]">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#86868b]">
                  <ImageIcon className="h-8 w-8 mb-2" />
                  <span className="text-xs">Pas de photo</span>
                </div>
              )}
              {item.is_featured && (
                <span className="absolute top-3 left-3 bg-[#1d1d1f] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Vedette
                </span>
              )}
              {!item.is_available && (
                <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Indispo
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-[#1d1d1f] text-[15px] truncate">
                  {item.name}
                </h3>
                <span className="font-bold text-[#1d1d1f] text-sm shrink-0">
                  {formatPrice(item.base_price)}
                </span>
              </div>
              {item.description && (
                <p className="text-[13px] text-[#86868b] line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 text-[#86868b]">
            <p>Aucun produit trouve</p>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onImageUpdated={handleImageUpdated}
          onToggleAvailable={() => toggleAvailability(editingItem)}
          onToggleFeatured={() => toggleFeatured(editingItem)}
        />
      )}
    </div>
  );
}

/* ─────────── Edit modal with image upload ─────────── */

function EditItemModal({
  item,
  onClose,
  onImageUpdated,
  onToggleAvailable,
  onToggleFeatured,
}: {
  item: MenuItem;
  onClose: () => void;
  onImageUpdated: (id: string, url: string | null) => void;
  onToggleAvailable: () => void;
  onToggleFeatured: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez selectionner une image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image doit faire moins de 5 Mo");
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${item.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("menu-images")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update menu_items row
      const { error: updateError } = await supabase
        .from("menu_items")
        .update({ image_url: publicUrl } as never)
        .eq("id", item.id);

      if (updateError) throw updateError;

      onImageUpdated(item.id, publicUrl);
      toast.success("Photo mise a jour");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Echec de l'upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async () => {
    if (!item.image_url) return;

    setUploading(true);
    try {
      const supabase = createClient();

      // Extract filename from URL
      const fileName = item.image_url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("menu-images").remove([fileName]);
      }

      const { error } = await supabase
        .from("menu_items")
        .update({ image_url: null } as never)
        .eq("id", item.id);

      if (error) throw error;

      onImageUpdated(item.id, null);
      toast.success("Photo supprimee");
    } catch (err) {
      console.error(err);
      toast.error("Echec de la suppression");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-[#e5e5ea] px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="font-bold text-lg text-[#1d1d1f]">{item.name}</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5ea] cursor-pointer"
          >
            <X className="h-4 w-4 text-[#1d1d1f]" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Image preview / upload */}
          <div>
            <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2 block">
              Photo
            </label>
            <div className="relative aspect-[16/10] bg-[#f5f5f7] rounded-2xl overflow-hidden">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="500px"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#86868b]">
                  <ImageIcon className="h-10 w-10 mb-2" />
                  <span className="text-sm">Aucune photo</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1d1d1f] text-white text-sm font-medium hover:opacity-90 cursor-pointer disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {item.image_url ? "Remplacer" : "Uploader"}
              </button>
              {item.image_url && (
                <button
                  onClick={handleRemoveImage}
                  disabled={uploading}
                  className="px-4 py-2.5 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] text-sm font-medium hover:bg-[#e5e5ea] cursor-pointer disabled:opacity-50"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>

          {/* Item info (read-only for now) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#86868b]">Prix</span>
              <span className="font-semibold text-[#1d1d1f]">
                {formatPrice(item.base_price)}
              </span>
            </div>
            {item.description && (
              <div>
                <span className="text-xs font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                  Description
                </span>
                <p className="text-sm text-[#1d1d1f] leading-relaxed">
                  {item.description}
                </p>
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-[#e5e5ea]">
            <button
              onClick={onToggleAvailable}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-[#f5f5f7] hover:bg-[#e5e5ea] cursor-pointer transition-colors"
            >
              <span className="text-sm font-medium text-[#1d1d1f]">
                Disponible
              </span>
              <div
                className={cn(
                  "h-6 w-10 rounded-full flex items-center px-0.5 transition-colors",
                  item.is_available ? "bg-[#1d1d1f] justify-end" : "bg-[#d2d2d7] justify-start"
                )}
              >
                <div className="h-5 w-5 rounded-full bg-white shadow-sm flex items-center justify-center">
                  {item.is_available && (
                    <Check className="h-3 w-3 text-[#1d1d1f]" />
                  )}
                </div>
              </div>
            </button>

            <button
              onClick={onToggleFeatured}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-[#f5f5f7] hover:bg-[#e5e5ea] cursor-pointer transition-colors"
            >
              <span className="text-sm font-medium text-[#1d1d1f]">
                Vedette (mis en avant)
              </span>
              <div
                className={cn(
                  "h-6 w-10 rounded-full flex items-center px-0.5 transition-colors",
                  item.is_featured ? "bg-[#1d1d1f] justify-end" : "bg-[#d2d2d7] justify-start"
                )}
              >
                <div className="h-5 w-5 rounded-full bg-white shadow-sm flex items-center justify-center">
                  {item.is_featured && (
                    <Check className="h-3 w-3 text-[#1d1d1f]" />
                  )}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
