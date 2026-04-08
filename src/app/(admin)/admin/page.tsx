"use client";

import {
  ShoppingBag,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const stats = [
  {
    title: "Commandes aujourd'hui",
    value: "47",
    change: "+12%",
    changeType: "positive" as const,
    icon: ShoppingBag,
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
  },
  {
    title: "Revenu du jour",
    value: formatPrice(52800),
    change: "+8%",
    changeType: "positive" as const,
    icon: DollarSign,
    color: "text-brand-green",
    bg: "bg-brand-green/10",
  },
  {
    title: "Panier moyen",
    value: formatPrice(1123),
    change: "-3%",
    changeType: "negative" as const,
    icon: TrendingUp,
    color: "text-brand-yellow",
    bg: "bg-brand-yellow/10",
  },
  {
    title: "Clients actifs",
    value: "234",
    change: "+18%",
    changeType: "positive" as const,
    icon: Users,
    color: "text-brand-pink",
    bg: "bg-brand-pink/10",
  },
];

const recentOrders = [
  { number: 47, name: "Marie L.", type: "delivery", total: 2380, status: "preparing", time: "Il y a 3 min" },
  { number: 46, name: "Thomas R.", type: "collect", total: 990, status: "ready", time: "Il y a 8 min" },
  { number: 45, name: "Sophie M.", type: "delivery", total: 1790, status: "out_for_delivery", time: "Il y a 15 min" },
  { number: 44, name: "Pierre D.", type: "collect", total: 850, status: "picked_up", time: "Il y a 22 min" },
  { number: 43, name: "Julie B.", type: "delivery", total: 2530, status: "delivered", time: "Il y a 30 min" },
];

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Vue d&apos;ensemble de votre activite
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-extrabold mt-1 text-foreground tabular-nums">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    stat.bg
                  )}
                >
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
              </div>
              <div className="mt-3">
                <Badge
                  variant={
                    stat.changeType === "positive" ? "success" : "destructive"
                  }
                  className="text-[10px]"
                >
                  {stat.change} vs hier
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart placeholder */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Revenue (7 derniers jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Graphique Recharts</p>
              <p className="text-xs mt-1">
                Se connectera une fois les donnees Supabase disponibles
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    #
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    Client
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                    Statut
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                    Temps
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.number}
                    className="border-b border-border/50 hover:bg-muted/30"
                  >
                    <td className="py-3 px-2 font-bold">
                      #{String(order.number).padStart(4, "0")}
                    </td>
                    <td className="py-3 px-2">{order.name}</td>
                    <td className="py-3 px-2">
                      <Badge
                        variant="outline"
                        className="text-[10px]"
                      >
                        {order.type === "delivery"
                          ? "Livraison"
                          : "A emporter"}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 font-semibold tabular-nums">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3 px-2">
                      <Badge
                        className={cn(
                          "text-[10px]",
                          order.status === "preparing" &&
                            "bg-brand-yellow/20 text-brand-yellow",
                          order.status === "ready" &&
                            "bg-brand-green/20 text-brand-green",
                          order.status === "out_for_delivery" &&
                            "bg-brand-pink/20 text-brand-pink",
                          order.status === "picked_up" &&
                            "bg-brand-green/20 text-brand-green",
                          order.status === "delivered" &&
                            "bg-brand-green/20 text-brand-green"
                        )}
                      >
                        {order.status === "preparing" && "En prep"}
                        {order.status === "ready" && "Pret"}
                        {order.status === "out_for_delivery" && "En livraison"}
                        {order.status === "picked_up" && "Recupere"}
                        {order.status === "delivered" && "Livre"}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right text-muted-foreground text-xs">
                      {order.time}
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
