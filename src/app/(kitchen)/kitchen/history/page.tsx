import { createAdminClient } from "@/lib/supabase/admin";
import { HistoryClient } from "./history-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Historique · Cuisine" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchDay(dateIso: string): Promise<any[]> {
  const supabase = createAdminClient();
  const start = new Date(dateIso + "T00:00:00");
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("orders")
    .select("*, order_items(*)")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .order("created_at", { ascending: false });

  return data ?? [];
}

export default async function KitchenHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const today = new Date().toISOString().split("T")[0];
  const targetDate = date || today;
  const orders = await fetchDay(targetDate);

  return <HistoryClient initialOrders={orders} initialDate={targetDate} />;
}
