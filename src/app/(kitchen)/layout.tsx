import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Cuisine | SOUTH STREET FOOD",
  robots: "noindex, nofollow",
};

export default async function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (profile as any)?.role;
  if (!role || !["kitchen", "admin"].includes(role)) {
    redirect("/login");
  }

  return (
    <div className="min-h-dvh bg-[#f5f5f7] text-[#1d1d1f]">{children}</div>
  );
}
