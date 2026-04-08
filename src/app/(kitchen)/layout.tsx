import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cuisine | SOUTH STREET FOOD",
  robots: "noindex, nofollow",
};

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#0a0a12] text-white">{children}</div>
  );
}
