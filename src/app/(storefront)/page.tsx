import { getBestSellers } from "@/lib/queries/menu";
import { HomeClient, type BestSellerItem } from "../home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const bestSellers = (await getBestSellers(4)) as BestSellerItem[];
  return <HomeClient bestSellers={bestSellers} />;
}
