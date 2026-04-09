"use client";

import Link from "next/link";
import { ShoppingBag, Gift, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  {
    href: "/account/orders",
    icon: ShoppingBag,
    label: "Mes commandes",
    description: "Historique et recommander",
  },
  {
    href: "/account/loyalty",
    icon: Gift,
    label: "Programme fidelite",
    description: "Vos points et recompenses",
    badge: "120 pts",
  },
];

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 py-10">
        {/* Profile header */}
        <div className="text-center mb-8">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-light mx-auto flex items-center justify-center text-white text-2xl font-bold mb-4">
            JD
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Jean Dupont
          </h1>
          <p className="text-sm text-muted-foreground">jean@exemple.fr</p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-yellow/10 text-brand-yellow">
            <Gift className="h-4 w-4" />
            <span className="text-sm font-semibold">120 points</span>
          </div>
        </div>

        {/* Menu */}
        <div className="space-y-3 mb-8">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-brand-purple" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {item.label}
                    </span>
                    {item.badge && (
                      <Badge className="bg-brand-yellow/20 text-brand-yellow text-[10px]">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Card>
            </Link>
          ))}
        </div>

        {/* Profile edit */}
        <Card className="p-5 mb-8">
          <h2 className="font-semibold text-foreground mb-4">
            Informations personnelles
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-medium">Jean Dupont</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telephone</span>
              <span className="font-medium">06 12 34 56 78</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">jean@exemple.fr</span>
            </div>
          </div>
        </Card>

        <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/5">
          <LogOut className="h-4 w-4" />
          Se deconnecter
        </Button>
      </div>
    </div>
  );
}
