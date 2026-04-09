"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowRight, Clock, MapPin, Truck, Star } from "lucide-react";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Motion primitives — subtle, Apple-grade
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function FadeIn({
  children,
  delay = 0,
  y = 20,
  className = "",
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "p" | "h1" | "h2" | "h3" | "span";
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.9, ease, delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   NAVBAR — glass, scroll-aware
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-nav" : ""
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className={`font-semibold text-[15px] tracking-tight transition-colors ${
            scrolled ? "text-foreground" : "text-white"
          }`}
        >
          South Street Food
        </Link>
        <div className="flex items-center gap-7">
          <Link
            href="/menu"
            className={`text-[13px] font-medium transition-colors hidden sm:block ${
              scrolled
                ? "text-muted-foreground hover:text-foreground"
                : "text-white/75 hover:text-white"
            }`}
          >
            La carte
          </Link>
          <Link
            href="/menu"
            className={`text-[13px] font-semibold px-4 py-2 rounded-full transition-all ${
              scrolled
                ? "bg-foreground text-background hover:opacity-90"
                : "bg-white text-foreground hover:bg-white/90"
            }`}
          >
            Commander
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HERO — Video + refined typography
   Apple-style: restrained, centered, quiet confidence
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Gentle parallax — nothing aggressive
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative h-[100svh] w-full overflow-hidden bg-black"
    >
      {/* Video background */}
      <motion.div style={{ scale: videoScale }} className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/video/hero-poster.jpg"
          className="w-full h-full object-cover"
        >
          <source src="/video/hero-burger.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Subtle gradient — not heavy-handed */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/25 to-black/70 pointer-events-none" />

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6"
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.3 }}
          className="text-white/70 text-[13px] font-medium tracking-[0.18em] uppercase mb-5"
        >
          Bayonne &middot; Anglet &middot; Biarritz
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease, delay: 0.5 }}
          className="text-white font-semibold text-[44px] sm:text-[72px] lg:text-[96px] leading-[1.02] tracking-[-0.035em] max-w-4xl"
        >
          La street food,
          <br />
          réinventée.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.75 }}
          className="mt-6 text-white/75 text-[17px] sm:text-[19px] leading-relaxed max-w-lg font-normal"
        >
          Burgers, tacos et wraps artisanaux.
          Livraison jusqu&apos;à 4h du matin.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.95 }}
          className="mt-10 flex items-center gap-6"
        >
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 bg-white text-foreground font-medium text-[15px] px-6 py-3 rounded-full hover:bg-white/90 transition-all"
          >
            Commander
          </Link>
          <Link
            href="#story"
            className="inline-flex items-center gap-1.5 text-white text-[15px] font-medium hover:opacity-80 transition-opacity"
          >
            Découvrir
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   STORY — Single bold statement on white
   Apple does this everywhere: one sentence, tons of space
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Story() {
  return (
    <section id="story" className="bg-background py-32 sm:py-48">
      <div className="max-w-5xl mx-auto px-6">
        <FadeIn as="p" className="text-[13px] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-8">
          Notre approche
        </FadeIn>
        <FadeIn
          as="h2"
          delay={0.1}
          className="text-foreground font-semibold text-[40px] sm:text-[56px] lg:text-[72px] leading-[1.05] tracking-[-0.03em] max-w-4xl"
        >
          De vrais ingrédients.
          <br />
          <span className="text-muted-foreground">
            De vraies recettes.
          </span>
        </FadeIn>
        <FadeIn
          as="p"
          delay={0.2}
          className="mt-8 text-muted-foreground text-[17px] sm:text-[19px] leading-relaxed max-w-2xl"
        >
          Rien de surgelé. Rien de préparé à l&apos;avance. Chaque burger,
          chaque tacos, chaque wrap est assemblé à la minute, à la commande,
          avec des produits frais sélectionnés le matin même.
        </FadeIn>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SHOWCASE — Scroll-pinned, but refined
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export interface BestSellerItem {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  description: string | null;
  image_url: string | null;
}

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function ShowcaseSlide({
  item,
  progress,
  index,
  total,
}: {
  item: BestSellerItem;
  progress: MotionValue<number>;
  index: number;
  total: number;
}) {
  const step = 1 / total;
  const start = index * step;
  const end = start + step;
  const fadeIn = start + step * 0.15;
  const fadeOut = end - step * 0.15;

  const opacity = useTransform(
    progress,
    [start, fadeIn, fadeOut, end],
    [0, 1, 1, 0]
  );
  const scale = useTransform(
    progress,
    [start, fadeIn, fadeOut, end],
    [0.94, 1, 1, 0.98]
  );
  const y = useTransform(
    progress,
    [start, fadeIn, fadeOut, end],
    [30, 0, 0, -20]
  );

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex items-center">
      <div className="w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center px-6 lg:px-20 max-w-7xl mx-auto">
        {/* Image */}
        <motion.div
          style={{ scale, y }}
          className="relative aspect-square lg:aspect-auto lg:h-[60vh] w-full max-w-lg mx-auto"
        >
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-[180px]">
              🍔
            </div>
          )}
        </motion.div>

        {/* Text */}
        <motion.div style={{ y }} className="text-foreground">
          <div className="text-muted-foreground text-[12px] font-medium tracking-[0.2em] uppercase mb-5">
            N°{String(index + 1).padStart(2, "0")} &mdash; Incontournable
          </div>
          <h3 className="font-semibold text-[40px] sm:text-[56px] lg:text-[64px] leading-[1.02] tracking-[-0.03em] mb-5">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-muted-foreground text-[17px] leading-relaxed max-w-md mb-8">
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-5">
            <span className="text-[22px] font-semibold text-foreground">
              {formatPrice(item.base_price)} &euro;
            </span>
            <Link
              href={`/item/${item.slug}`}
              className="inline-flex items-center gap-1.5 text-[15px] font-medium text-foreground hover:opacity-70 transition-opacity"
            >
              Composer
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function ProgressDot({
  progress,
  index,
  total,
}: {
  progress: MotionValue<number>;
  index: number;
  total: number;
}) {
  const step = 1 / total;
  const opacity = useTransform(
    progress,
    [index * step, index * step + step * 0.15, (index + 1) * step - step * 0.15, (index + 1) * step],
    [0.25, 1, 1, 0.25]
  );
  const width = useTransform(
    progress,
    [index * step, index * step + step * 0.15, (index + 1) * step - step * 0.15, (index + 1) * step],
    [16, 32, 32, 16]
  );
  return (
    <motion.div
      style={{ opacity, width }}
      className="h-[3px] rounded-full bg-foreground"
    />
  );
}

function Showcase({ items }: { items: BestSellerItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  if (items.length === 0) return null;
  const total = items.length;

  return (
    <section
      ref={ref}
      className="relative bg-background"
      style={{ height: `${total * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Section label */}
        <div className="absolute top-24 left-6 sm:left-12 lg:left-20 z-10">
          <div className="text-[12px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
            Nos incontournables
          </div>
        </div>

        {/* Progress dots (bottom center) */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          {items.map((_, i) => (
            <ProgressDot
              key={i}
              progress={scrollYProgress}
              index={i}
              total={total}
            />
          ))}
        </div>

        {/* Slides */}
        {items.map((item, i) => (
          <ShowcaseSlide
            key={item.id}
            item={item}
            progress={scrollYProgress}
            index={i}
            total={total}
          />
        ))}
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FEATURES — 3 columns, minimal, lots of space
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Features() {
  const items = [
    {
      icon: Star,
      title: "Qualité artisanale",
      desc: "Ingrédients frais sélectionnés chaque jour. Des recettes maison qui font la différence.",
    },
    {
      icon: Truck,
      title: "Livré en 30 min",
      desc: "Commandez en ligne, on livre chaud chez vous. Sur tout le BAB et alentours.",
    },
    {
      icon: MapPin,
      title: "Click & Collect",
      desc: "Commandez, choisissez votre créneau, et récupérez au restaurant. Zéro attente.",
    },
  ];

  return (
    <section className="py-32 sm:py-48 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn
          as="p"
          className="text-[13px] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-4 text-center"
        >
          Pourquoi nous
        </FadeIn>
        <FadeIn
          as="h2"
          delay={0.1}
          className="text-foreground font-semibold text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.05] tracking-[-0.03em] text-center max-w-3xl mx-auto"
        >
          Trois bonnes raisons.
        </FadeIn>

        <div className="mt-20 grid sm:grid-cols-3 gap-x-12 gap-y-16">
          {items.map((f, i) => (
            <FadeIn key={f.title} delay={0.15 + i * 0.08}>
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-6">
                <f.icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-[19px] text-foreground mb-2 tracking-tight">
                {f.title}
              </h3>
              <p className="text-muted-foreground text-[15px] leading-relaxed">
                {f.desc}
              </p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   NIGHT — Subtle dark section
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Night() {
  return (
    <section className="bg-[#0a0a0a] text-white py-32 sm:py-48">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <FadeIn
          as="p"
          className="text-[13px] font-medium tracking-[0.18em] uppercase text-white/50 mb-6"
        >
          La nuit
        </FadeIn>
        <FadeIn
          as="h2"
          delay={0.1}
          className="text-white font-semibold text-[40px] sm:text-[56px] lg:text-[72px] leading-[1.05] tracking-[-0.03em] max-w-3xl mx-auto"
        >
          Ouvert jusqu&apos;à 4h.
          <br />
          <span className="text-white/55">Livré en 30 minutes.</span>
        </FadeIn>
        <FadeIn
          as="p"
          delay={0.2}
          className="mt-8 text-white/60 text-[17px] sm:text-[19px] leading-relaxed max-w-xl mx-auto"
        >
          Que ce soit pour un dîner tardif ou une sortie qui s&apos;éternise,
          on est là. Sur Bayonne, Anglet, Biarritz et alentours.
        </FadeIn>
        <FadeIn delay={0.3} className="mt-12">
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 bg-white text-foreground font-medium text-[15px] px-6 py-3 rounded-full hover:bg-white/90 transition-all"
          >
            Voir la carte
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CTA — final
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function CTA() {
  return (
    <section className="py-32 sm:py-48 bg-background">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <FadeIn
          as="h2"
          className="text-foreground font-semibold text-[44px] sm:text-[64px] lg:text-[80px] leading-[1.02] tracking-[-0.035em]"
        >
          Prêt à commander ?
        </FadeIn>
        <FadeIn
          as="p"
          delay={0.1}
          className="mt-6 text-muted-foreground text-[17px] sm:text-[19px] max-w-md mx-auto"
        >
          30 minutes pour vous régaler. Chez vous, ou au restaurant.
        </FadeIn>
        <FadeIn delay={0.2} className="mt-10">
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 bg-foreground text-background font-medium text-[15px] px-7 py-3.5 rounded-full hover:opacity-90 transition-opacity"
          >
            Commander
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FOOTER
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Footer() {
  return (
    <footer className="border-t border-border py-16 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-3 gap-12 mb-12">
          <div>
            <h4 className="font-semibold text-[15px] text-foreground mb-2">
              South Street Food
            </h4>
            <p className="text-muted-foreground text-[13px] leading-relaxed max-w-xs">
              Le concept street food exclusif de Bayonne.
            </p>
          </div>
          <div>
            <h4 className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.15em] mb-4">
              Navigation
            </h4>
            <ul className="space-y-3">
              {[
                { label: "La carte", href: "/menu" },
                { label: "Commander", href: "/menu" },
                { label: "Mon compte", href: "/account" },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-foreground text-[13px] hover:opacity-60 transition-opacity"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.15em] mb-4">
              Infos
            </h4>
            <ul className="space-y-3 text-[13px]">
              <li className="text-foreground">Bayonne, France</li>
              <li className="text-muted-foreground">
                Bayonne &middot; Anglet &middot; Biarritz
              </li>
              <li className="text-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Jusqu&apos;à 4h
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-[12px]">
            &copy; {new Date().getFullYear()} South Street Food
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground text-[12px] transition-colors"
            >
              Mentions légales
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground text-[12px] transition-colors"
            >
              CGV
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PAGE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function HomeClient({ bestSellers }: { bestSellers: BestSellerItem[] }) {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Story />
        <Showcase items={bestSellers} />
        <Features />
        <Night />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
