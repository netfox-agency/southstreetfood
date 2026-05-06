import { Navbar } from "@/components/storefront/navbar";
import { Footer } from "@/components/storefront/footer";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {/* Navbar = pills flottantes au top, pas de barre full-width.
          Le contenu hero peut s'etaler dessous (overlap intentionnel,
          renforce le glass). Padding bottom mobile pour la bottom-nav. */}
      <main className="flex-1 pt-16 pb-24 sm:pb-0">{children}</main>
      <Footer />
    </>
  );
}
