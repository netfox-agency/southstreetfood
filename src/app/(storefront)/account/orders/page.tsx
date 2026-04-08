"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import { formatDate, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const DEMO_ORDERS = [
  {
    id: "ord-1",
    order_number: 42,
    status: "picked_up" as const,
    order_type: "collect" as const,
    total: 1340,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    items: ["1x Le Classic Smash (Menu)"],
  },
  {
    id: "ord-2",
    order_number: 38,
    status: "delivered" as const,
    order_type: "delivery" as const,
    total: 2530,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    items: ["2x Tacos XL", "1x Frites Maison"],
  },
  {
    id: "ord-3",
    order_number: 31,
    status: "delivered" as const,
    order_type: "delivery" as const,
    total: 1690,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    items: ["1x Le South Burger (Menu)", "1x Coca-Cola"],
  },
];

export default function OrderHistoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Mon compte
        </Link>

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-8">
          Mes commandes
        </h1>

        <div className="space-y-3">
          {DEMO_ORDERS.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      #{String(order.order_number).padStart(4, "0")}
                    </span>
                    <Badge
                      className={cn(
                        "text-[10px]",
                        ORDER_STATUS_COLORS[order.status]
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(order.created_at)} a{" "}
                    {formatTime(order.created_at)}
                  </p>
                </div>
                <PriceDisplay cents={order.total} size="sm" />
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {order.items.join(" · ")}
              </p>

              <Button variant="outline" size="sm" className="w-full gap-2">
                <RotateCcw className="h-3.5 w-3.5" />
                Recommander
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
