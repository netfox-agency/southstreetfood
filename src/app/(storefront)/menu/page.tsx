import { getCategoriesWithItems } from "@/lib/queries/menu";
import { MenuClient } from "./menu-client";

export const revalidate = 30; // ISR: refresh data every 30s

export default async function MenuPage() {
  const categories = await getCategoriesWithItems();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <MenuClient categories={categories as any} />;
}
