"use client";

import { cn } from "@/lib/utils";
import type { Category } from "@/types/menu";

interface CategoryTabsProps {
  categories: Category[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}

export function CategoryTabs({
  categories,
  activeSlug,
  onSelect,
}: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
      <button
        onClick={() => onSelect("all")}
        className={cn(
          "shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer",
          activeSlug === "all"
            ? "bg-brand-purple text-white shadow-md shadow-brand-purple/25"
            : "bg-secondary text-secondary-foreground hover:bg-muted"
        )}
      >
        Tout
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.slug)}
          className={cn(
            "shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap",
            activeSlug === cat.slug
              ? "bg-brand-purple text-white shadow-md shadow-brand-purple/25"
              : "bg-secondary text-secondary-foreground hover:bg-muted"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
