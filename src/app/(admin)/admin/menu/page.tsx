import { createAdminClient } from "@/lib/supabase/admin";
import { MenuAdminClient } from "./menu-admin-client";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const supabase = createAdminClient();

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order"),
    supabase.from("menu_items").select("*").order("display_order"),
  ]);

  return (
    <MenuAdminClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categories={(categories || []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items={(items || []) as any}
    />
  );
}
