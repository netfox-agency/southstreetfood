import { getBestSellers } from "@/lib/queries/menu";
import { HomeClient, type BestSellerItem } from "../home-client";

export const revalidate = 60; // ISR: refresh data every 60s

export default async function HomePage() {
  const bestSellers = (await getBestSellers(4)) as BestSellerItem[];
  return <HomeClient bestSellers={bestSellers} />;
}
