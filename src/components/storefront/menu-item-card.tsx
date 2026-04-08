"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/shared/price-display";
import type { MenuItem } from "@/types/menu";
import { cn } from "@/lib/utils";

interface MenuItemCardProps {
  item: MenuItem;
  className?: string;
}

export function MenuItemCard({ item, className }: MenuItemCardProps) {
  return (
    <Link href={`/item/${item.slug}`}>
      <Card
        className={cn(
          "group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer",
          "hover:-translate-y-1",
          !item.is_available && "opacity-60",
          className
        )}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-purple-subtle to-muted">
              <span className="text-4xl">
                {item.name.toLowerCase().includes("burger")
                  ? "🍔"
                  : item.name.toLowerCase().includes("taco")
                  ? "🌮"
                  : item.name.toLowerCase().includes("wrap")
                  ? "🌯"
                  : "🍽️"}
              </span>
            </div>
          )}

          {/* Featured badge */}
          {item.is_featured && (
            <Badge className="absolute top-3 left-3 bg-brand-yellow text-black">
              Populaire
            </Badge>
          )}

          {/* Unavailable overlay */}
          {!item.is_available && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Badge variant="secondary" className="text-sm">
                Indisponible
              </Badge>
            </div>
          )}

          {/* Quick add button */}
          {item.is_available && (
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="h-10 w-10 rounded-full bg-brand-purple text-white flex items-center justify-center shadow-lg shadow-brand-purple/30 hover:bg-brand-purple-light transition-colors">
                <Plus className="h-5 w-5" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground group-hover:text-brand-purple transition-colors">
            {item.name}
          </h3>
          {item.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <PriceDisplay cents={item.base_price} size="md" />
            {item.allergens && item.allergens.length > 0 && (
              <div className="flex gap-1">
                {item.allergens.slice(0, 3).map((a) => (
                  <span
                    key={a}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
