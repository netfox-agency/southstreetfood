import { Navbar } from "@/components/storefront/navbar";
import { Footer } from "@/components/storefront/footer";
import { HeroSection } from "@/components/storefront/hero-section";
import { FeaturedItems } from "@/components/storefront/featured-items";
import { BrandStory } from "@/components/storefront/brand-story";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturedItems />
        <BrandStory />
      </main>
      <Footer />
    </>
  );
}
