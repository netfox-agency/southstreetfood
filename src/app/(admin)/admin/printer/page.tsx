import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PrinterAdminClient } from "./printer-admin-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * /admin/printer — monitoring de la queue d'impression Server Direct Print.
 *
 * Affiche :
 *  - URL de poll a configurer dans l'imprimante (avec token)
 *  - Stats queue (pending / in_flight / printed / failed)
 *  - 50 derniers jobs avec leur statut
 *  - Bouton "Retry" sur jobs failed
 *  - Bouton "Test print" qui ajoute un job de test
 */
export default async function AdminPrinterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/admin/printer");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || (profile as { role: string }).role !== "admin") {
    redirect("/");
  }

  // Stats queue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allJobs } = await (admin as any)
    .from("print_jobs")
    .select(
      "id, order_id, status, attempts, last_error, created_at, printed_at, served_at, expires_at, orders:order_id(order_number, customer_name, order_type, total)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jobs = ((allJobs ?? []) as any[]).map((j) => ({
    id: j.id,
    orderId: j.order_id,
    orderNumber: j.orders?.order_number ?? null,
    customerName: j.orders?.customer_name ?? null,
    orderType: j.orders?.order_type ?? null,
    total: j.orders?.total ?? null,
    status: j.status,
    attempts: j.attempts,
    lastError: j.last_error,
    createdAt: j.created_at,
    printedAt: j.printed_at,
    servedAt: j.served_at,
  }));

  const stats = {
    pending: jobs.filter((j) => j.status === "pending").length,
    inFlight: jobs.filter((j) => j.status === "in_flight").length,
    printed: jobs.filter((j) => j.status === "printed").length,
    failed: jobs.filter((j) => j.status === "failed").length,
  };

  const pollUrl = `https://southstreetfood.vercel.app/api/printer/poll`;

  return <PrinterAdminClient jobs={jobs} stats={stats} pollUrl={pollUrl} />;
}
