"use client";

import { useState } from "react";
import { Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { cn } from "@/lib/utils";

const DEMO_ITEMS = [
  { id: "1", name: "Le Classic Smash", category: "Burgers", price: 990, available: true, featured: true },
  { id: "2", name: "Le South Burger", category: "Burgers", price: 1290, available: true, featured: true },
  { id: "3", name: "Le Chicken Burger", category: "Burgers", price: 890, available: true, featured: false },
  { id: "4", name: "Tacos XL", category: "Tacos", price: 890, available: true, featured: true },
  { id: "5", name: "Tacos XXL", category: "Tacos", price: 1190, available: false, featured: false },
  { id: "6", name: "Wrap Chicken Avocado", category: "Wraps", price: 850, available: true, featured: true },
  { id: "7", name: "Wrap Veggie", category: "Wraps", price: 790, available: true, featured: false },
  { id: "8", name: "Frites Maison", category: "Accompagnements", price: 350, available: true, featured: false },
  { id: "9", name: "Nuggets x6", category: "Accompagnements", price: 450, available: true, featured: false },
];

export default function AdminMenuPage() {
  const [items, setItems] = useState(DEMO_ITEMS);

  const toggleAvailability = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, available: !item.available } : item
      )
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Menu
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gerez vos produits et prix
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Produit
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Categorie
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Prix
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                    Disponible
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                    Vedette
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-b border-border/50 hover:bg-muted/30 transition-colors",
                      !item.available && "opacity-60"
                    )}
                  >
                    <td className="py-3 px-4">
                      <span className="font-semibold text-foreground">
                        {item.name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <PriceDisplay cents={item.price} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleAvailability(item.id)}
                        className="cursor-pointer"
                      >
                        {item.available ? (
                          <ToggleRight className="h-6 w-6 text-brand-green" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.featured && (
                        <Badge className="bg-brand-yellow/20 text-brand-yellow text-[10px]">
                          Vedette
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
