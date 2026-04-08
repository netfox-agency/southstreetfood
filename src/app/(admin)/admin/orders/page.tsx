"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/shared/price-display";
import { Search, Download } from "lucide-react";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const DEMO_ORDERS = [
  { number: 47, name: "Marie L.", email: "marie@exemple.fr", type: "delivery", total: 2380, status: "preparing", date: new Date(Date.now() - 3 * 60000).toISOString() },
  { number: 46, name: "Thomas R.", email: "thomas@exemple.fr", type: "collect", total: 990, status: "ready", date: new Date(Date.now() - 8 * 60000).toISOString() },
  { number: 45, name: "Sophie M.", email: null, type: "delivery", total: 1790, status: "delivered", date: new Date(Date.now() - 15 * 60000).toISOString() },
  { number: 44, name: "Pierre D.", email: "pierre@exemple.fr", type: "collect", total: 850, status: "picked_up", date: new Date(Date.now() - 22 * 60000).toISOString() },
  { number: 43, name: "Julie B.", email: "julie@exemple.fr", type: "delivery", total: 2530, status: "delivered", date: new Date(Date.now() - 30 * 60000).toISOString() },
  { number: 42, name: "Jean D.", email: null, type: "collect", total: 1340, status: "picked_up", date: new Date(Date.now() - 2 * 3600000).toISOString() },
];

export default function AdminOrdersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Commandes
          </h1>
          <p className="mt-1 text-muted-foreground">
            Historique de toutes les commandes
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par numero, nom ou email..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">#</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Client</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Statut</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ORDERS.map((order) => (
                  <tr key={order.number} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer">
                    <td className="py-3 px-4 font-bold">#{String(order.number).padStart(4, "0")}</td>
                    <td className="py-3 px-4">
                      <div>{order.name}</div>
                      {order.email && <div className="text-xs text-muted-foreground">{order.email}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px]">
                        {order.type === "delivery" ? "Livraison" : "A emporter"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold tabular-nums">{formatPrice(order.total)}</td>
                    <td className="py-3 px-4">
                      <Badge className={cn("text-[10px]",
                        order.status === "preparing" && "bg-brand-yellow/20 text-brand-yellow",
                        order.status === "ready" && "bg-brand-green/20 text-brand-green",
                        (order.status === "delivered" || order.status === "picked_up") && "bg-brand-green/20 text-brand-green",
                      )}>
                        {order.status === "preparing" && "En prep"}
                        {order.status === "ready" && "Pret"}
                        {order.status === "delivered" && "Livre"}
                        {order.status === "picked_up" && "Recupere"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                      {formatDate(order.date)}<br />{formatTime(order.date)}
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
