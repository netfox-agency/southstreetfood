import { getMenuItemBySlug, getMenuSideOptions } from "@/lib/queries/menu";
import { notFound } from "next/navigation";
import { ItemClient } from "./item-client";
import { MENU_ELIGIBLE_SLUGS } from "@/lib/constants";

export const revalidate = 30; // ISR: refresh data every 30s

export default async function ItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getMenuItemBySlug(slug);

  if (!item) notFound();

  const isMenuEligible = MENU_ELIGIBLE_SLUGS.includes(slug);
  // Only fetch menu options (drinks + fries) for eligible items — saves a roundtrip otherwise.
  const menuOptions = isMenuEligible ? await getMenuSideOptions() : null;

  return (
    <ItemClient
      item={item}
      isMenuEligible={isMenuEligible}
      menuOptions={menuOptions}
    />
  );
}
