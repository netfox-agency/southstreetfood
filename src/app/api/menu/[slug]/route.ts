import { NextResponse } from "next/server";
import { getMenuItemBySlug, getMenuSideOptions } from "@/lib/queries/menu";
import { MENU_ELIGIBLE_SLUGS } from "@/lib/constants";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const item = await getMenuItemBySlug(slug);

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Bundle menu eligibility + side options (drinks/fries) into the same
  // response so the bottom-sheet only needs one roundtrip.
  const isMenuEligible = MENU_ELIGIBLE_SLUGS.includes(slug);
  const menuOptions = isMenuEligible ? await getMenuSideOptions() : null;

  return NextResponse.json(
    { ...item, isMenuEligible, menuOptions },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    },
  );
}
