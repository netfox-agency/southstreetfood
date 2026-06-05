import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import { formatDate, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * /account/orders — Historique reel des commandes du client connecte.
 *
 * Server component : check auth, puis fetch les commandes liees a son
 * user_id (scope strict, pas d'IDOR). Etat vide propre si aucune commande.
 */
type OrderRow = {
  id: string;
  order_number: number;
  status: string;
  order_type: string;
  total: number;
  created_at: string;
  order_items: { item_name: string; quantity: number }[] | null;
};

export default async function OrderHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/account/orders");
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("orders")
    .select(
      "id, order_number, status, order_type, total, created_at, order_items(item_name, quantity)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const orders = (data || []) as OrderRow[];

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

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="h-12 w-12 text-[#d1d1d6] mb-4" />
            <p className="text-foreground font-semibold mb-1">
              Aucune commande pour le moment
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Vos commandes apparaitront ici.
            </p>
            <Link
              href="/menu"
              className="px-6 py-3 bg-[#1d1d1f] text-white rounded-xl text-sm font-semibold hover:bg-[#1d1d1f]/90 transition-colors"
            >
              Voir le menu
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const itemsLabel = (order.order_items || [])
                .map((it) => `${it.quantity}x ${it.item_name}`)
                .join(" · ");
              return (
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
                            ORDER_STATUS_COLORS[order.status],
                          )}
                        >
                          {ORDER_STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(order.created_at)} a{" "}
                        {formatTime(order.created_at)}
                      </p>
                    </div>
                    <PriceDisplay cents={order.total} size="sm" />
                  </div>

                  {itemsLabel && (
                    <p className="text-sm text-muted-foreground">{itemsLabel}</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
