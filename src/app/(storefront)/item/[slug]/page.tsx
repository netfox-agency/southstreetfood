import { getMenuItemBySlug } from "@/lib/queries/menu";
import { notFound } from "next/navigation";
import { ItemClient } from "./item-client";

export const revalidate = 30; // ISR: refresh data every 30s

export default async function ItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getMenuItemBySlug(slug);

  if (!item) notFound();

  return <ItemClient item={item} />;
}
