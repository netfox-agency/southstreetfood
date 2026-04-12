"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Clock, MapPin, Truck, Star } from "lucide-react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.12, duration: 0.9, ease },
  }),
};

function Reveal({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   NAVBAR
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
          aria-label="South Street Food"
          className="flex items-center"
        >
          <Image
            src="/brand/logo.avif"
            alt="South Street Food"
            width={68}
            height={41}
            priority
            className="h-9 w-auto object-contain"
          />
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/menu"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            La carte
          </Link>
          <Link href="/menu" className="btn-primary !py-2.5 !px-5 text-sm">
            Commander
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HERO — Clean, bold, Burger King / G La Dalle level
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Hero() {
  return (
    <section className="relative h-screen overflow-hidden bg-black -mt-16">
      {/* Full-bleed hero image — mobile portrait + desktop landscape */}
      <div className="absolute inset-0 z-0 sm:hidden">
        <Image
          src="/hero-food-mobile.png"
          alt="South Street Food — burgers, tacos, wraps et boissons"
          fill
          className="object-cover object-[center_20%]"
          priority
          unoptimized
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 z-0 hidden sm:block">
        <Image
          src="/hero-food.png"
          alt="South Street Food — burgers, tacos, wraps et boissons"
          fill
          className="object-cover object-center"
          priority
          unoptimized
          sizes="100vw"
        />
      </div>
      {/* Gradient — stronger at bottom for text readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Mobile: centered — Desktop: bottom-left like EXODE */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center sm:items-start sm:justify-end px-6 sm:px-12 lg:px-16 pt-16 sm:pb-16 text-white">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease, delay: 0.3 }}
          className="text-center sm:text-left text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold text-white leading-[1.05] tracking-[-0.03em] max-w-2xl"
        >
          Le go&ucirc;t du{" "}
          <span className="italic font-light">sud.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.7 }}
          className="mt-4 text-center sm:text-left text-white/60 text-base sm:text-lg font-light max-w-md leading-relaxed"
        >
          Burgers, tacos &amp; wraps artisanaux.
          <br className="sm:hidden" />
          Livr&eacute;s chez vous jusqu&apos;&agrave; 4h du matin.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 1 }}
          className="mt-8 flex items-center gap-5"
        >
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-7 py-3 text-sm font-medium text-white bg-white/[0.1] hover:bg-white/[0.18] rounded-full border border-white/[0.2] backdrop-blur-md transition-all duration-300"
          >
            Commander
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#concept"
            className="text-sm text-white/40 hover:text-white/60 font-light transition-colors hidden sm:inline"
          >
            En savoir plus
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BEST SELLERS — Real items from Supabase
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

function BestSellers({ items }: { items: BestSellerItem[] }) {
  return (
    <Reveal className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div variants={fadeUp} custom={0} className="mb-12">
          <p className="text-brand font-semibold text-sm uppercase tracking-wide mb-2">
            Les best sellers
          </p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Nos incontournables
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item, i) => (
            <motion.div key={item.id} variants={fadeUp} custom={i + 1}>
              <Link href={`/item/${item.slug}`} className="block">
                <div className="card-premium hover-lift p-0 overflow-hidden cursor-pointer">
                  {/* Image area */}
                  <div className="aspect-square bg-gradient-to-br from-muted to-white flex items-center justify-center overflow-hidden">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-7xl">🍔</span>
                    )}
                  </div>
                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-base line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1 line-clamp-2 min-h-[2.5rem]">
                      {item.description || ""}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-brand text-lg">
                        {formatPrice(item.base_price)} &euro;
                      </span>
                      <span className="h-9 w-9 rounded-xl bg-brand text-white flex items-center justify-center text-lg font-bold">
                        +
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div variants={fadeUp} custom={5} className="mt-10 text-center">
          <Link href="/menu" className="btn-outline">
            Voir toute la carte
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </Reveal>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CONCEPT — Le concept
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Concept() {
  return (
    <Reveal id="concept" className="dark-section py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Images */}
          <motion.div variants={fadeUp} custom={0}>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-6xl">
                🍔
              </div>
              <div className="space-y-4">
                <div className="aspect-square rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-5xl">
                  🍟
                </div>
                <div className="aspect-square rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-5xl">
                  🌮
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <div>
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-brand font-semibold text-sm uppercase tracking-wide mb-4"
            >
              Le concept
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-[0.95] mb-6"
            >
              Concept exclusif
              <br />
              a Bayonne
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-white/45 text-lg leading-relaxed mb-8 max-w-md"
            >
              Notre menu varie vous regale a petit prix, sans contrainte,
              a tout moment de la soiree. Seul, en famille ou entre amis.
              Des ingredients frais, des recettes qui envoient.
            </motion.p>
            <motion.div variants={fadeUp} custom={3}>
              <Link href="/menu" className="btn-primary">
                Voir la carte
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DELIVERY — Livraison section
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Delivery() {
  return (
    <Reveal className="py-24 sm:py-32 bg-muted">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-brand font-semibold text-sm uppercase tracking-wide mb-4"
            >
              Livraison
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl font-black tracking-tight leading-[0.95] mb-6"
            >
              Livraison toute
              <br />
              la nuit
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-md"
            >
              Ouvert jusqu&apos;a 4h du matin avec livraison rapide
              sur Bayonne, Anglet et Biarritz. En moyenne 30 minutes
              chez vous.
            </motion.p>

            {/* Stats */}
            <motion.div
              variants={fadeUp}
              custom={3}
              className="grid grid-cols-3 gap-6"
            >
              {[
                { value: "30", unit: "min", label: "Temps moyen" },
                { value: "4h", unit: "", label: "Ouvert jusqu'a" },
                { value: "BAB", unit: "", label: "Zone couverte" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-black text-brand">
                    {s.value}
                    <span className="text-lg">{s.unit}</span>
                  </div>
                  <div className="text-muted-foreground text-sm mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Image */}
          <motion.div variants={fadeUp} custom={2}>
            <div className="aspect-[16/9] rounded-3xl overflow-hidden relative img-premium">
              <Image
                src="/delivery-van.png"
                alt="Camionette de livraison South Speed Food sur la côte basque"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </Reveal>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FEATURES — 3 features propres
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Features() {
  const items = [
    {
      icon: Star,
      title: "Qualite artisanale",
      desc: "Ingredients frais selectionnes chaque jour. Des recettes maison qui font la difference.",
    },
    {
      icon: Truck,
      title: "Livre en 30 min",
      desc: "Commandez en ligne, on livre chaud chez vous. Bayonne, Anglet, Biarritz et alentours.",
    },
    {
      icon: MapPin,
      title: "Click & Collect",
      desc: "Commandez, choisissez votre creneau, et recuperez au restaurant. Zero attente.",
    },
  ];

  return (
    <Reveal className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-3 gap-6">
          {items.map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} custom={i}>
              <div className="card-premium p-8 h-full">
                <div className="h-12 w-12 rounded-2xl bg-brand/8 flex items-center justify-center mb-5">
                  <f.icon className="h-6 w-6 text-brand" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   RESTAURANT — Photo lieu
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Restaurant() {
  return (
    <Reveal className="py-24 sm:py-32 bg-muted">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
          <p className="text-brand font-semibold text-sm uppercase tracking-wide mb-2">
            Le restaurant
          </p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Sur place ou a emporter
          </h2>
        </motion.div>

        <motion.div variants={fadeUp} custom={1}>
          <div className="relative aspect-[21/9] rounded-3xl bg-gradient-to-br from-accent/5 to-muted border border-border overflow-hidden img-premium">
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Photo interieur restaurant</p>
              </div>
            </div>
            {/* Bottom gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-8">
              <h3 className="text-white text-xl font-bold">
                South Street Food
              </h3>
              <p className="text-white/60 text-sm">Bayonne, France</p>
            </div>
          </div>
        </motion.div>
      </div>
    </Reveal>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CTA Final
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function CTA() {
  return (
    <Reveal className="py-24 sm:py-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.h2
          variants={fadeUp}
          custom={0}
          className="text-4xl sm:text-5xl font-black tracking-tight mb-6"
        >
          Une faim de loup ?
        </motion.h2>
        <motion.p
          variants={fadeUp}
          custom={1}
          className="text-muted-foreground text-lg mb-10 max-w-md mx-auto"
        >
          Commandez maintenant et recevez votre commande en 30 minutes,
          ou recuperez-la au restaurant.
        </motion.p>
        <motion.div variants={fadeUp} custom={2}>
          <Link href="/menu" className="btn-primary text-base !py-4 !px-10">
            Commander maintenant
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </Reveal>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FOOTER
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Footer() {
  return (
    <footer className="border-t border-border py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-3 gap-12 mb-12">
          <div>
            <Image
              src="/brand/logo.avif"
              alt="South Street Food"
              width={100}
              height={60}
              className="h-12 w-auto object-contain mb-3"
            />
            <p className="text-muted-foreground text-sm leading-relaxed">
              Le concept street food exclusif de Bayonne.
              Ouvert jusqu&apos;a 4h du matin.
            </p>
          </div>
          <div>
            <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5">
              {["La carte", "Commander", "Mon compte"].map((l) => (
                <li key={l}>
                  <Link
                    href="/menu"
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-4">
              Infos
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>Bayonne, France</li>
              <li>Livraison Bayonne &middot; Anglet &middot; Biarritz</li>
              <li className="text-neon-green font-medium">
                Ouvert jusqu&apos;a 4h
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground/50 text-xs">
            &copy; {new Date().getFullYear()} South Street Food
          </p>
          <div className="flex gap-5">
            <Link href="#" className="text-muted-foreground/50 hover:text-muted-foreground text-xs transition-colors">
              Mentions legales
            </Link>
            <Link href="#" className="text-muted-foreground/50 hover:text-muted-foreground text-xs transition-colors">
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
        <BestSellers items={bestSellers} />
        <Concept />
        <Delivery />
        <Features />
        <Restaurant />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
