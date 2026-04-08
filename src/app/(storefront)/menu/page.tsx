import { getCategoriesWithItems } from "@/lib/queries/menu";
import { MenuClient } from "./menu-client";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const categories = await getCategoriesWithItems();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <MenuClient categories={categories as any} />;
}
