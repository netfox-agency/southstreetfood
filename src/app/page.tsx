"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Clock, MapPin, Truck, Star, Phone } from "lucide-react";

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
        <Link href="/" className="font-extrabold text-lg tracking-tight">
          South Street Food
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
    <section className="dark-section relative min-h-screen flex items-center overflow-hidden">
      {/* Subtle warm gradient — not neon overload */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a14] via-[#0f0f1a] to-[#0a1a1a]" />

      {/* One soft ambient glow — restrained */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-[200px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-32 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Text */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.2 }}
              className="text-brand font-semibold text-sm tracking-wide uppercase mb-4"
            >
              Bayonne &middot; Anglet &middot; Biarritz
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.2, ease, delay: 0.3 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight"
            >
              Burgers, tacos
              <br />
              &amp; wraps
              <br />
              <span className="text-brand">artisanaux.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.6 }}
              className="mt-6 text-white/45 text-lg leading-relaxed max-w-sm"
            >
              Le concept street food exclusif de Bayonne.
              Livraison jusqu&apos;a 4h du matin sur tout le BAB.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.8 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link href="/menu" className="btn-primary text-base !py-4 !px-8">
                Je commande
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#concept" className="btn-outline text-base !py-4 !px-8 text-white border-white/15 hover:border-white/40">
                Decouvrir
              </Link>
            </motion.div>

            {/* Minimal info chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="mt-12 flex flex-wrap gap-3"
            >
              {[
                { icon: Clock, text: "Jusqu'a 4h" },
                { icon: Truck, text: "Livraison 30 min" },
                { icon: MapPin, text: "Click & Collect" },
              ].map((f) => (
                <span
                  key={f.text}
                  className="flex items-center gap-2 text-white/30 text-sm"
                >
                  <f.icon className="h-3.5 w-3.5" />
                  {f.text}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right — Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease, delay: 0.5 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="aspect-square rounded-[32px] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] overflow-hidden flex items-center justify-center">
                {/* Replace with real hero burger photo */}
                <div className="text-center">
                  <div className="text-[120px] leading-none">🍔</div>
                  <p className="text-white/15 text-sm mt-4">Photo hero burger</p>
                </div>
              </div>

              {/* Floating card — reviews */}
              <div className="absolute -bottom-6 -left-6 glass rounded-2xl px-5 py-4 flex items-center gap-3">
                <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 text-neon-yellow fill-neon-yellow"
                    />
                  ))}
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">4.8/5</div>
                  <div className="text-white/40 text-xs">+500 avis</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BEST SELLERS — G La Dalle style product cards
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const BEST_SELLERS = [
  { name: "Le Classic Smash", desc: "Double smash, cheddar fondu, sauce maison", price: "9,90", emoji: "🍔" },
  { name: "Tacos XL", desc: "Tortilla geante, viande, frites, sauce fromagere", price: "8,90", emoji: "🌮" },
  { name: "Le South Burger", desc: "Triple viande, bacon, jalapenos, sauce BBQ", price: "12,90", emoji: "🍔" },
  { name: "Wrap Chicken Avocado", desc: "Poulet grille, avocat, salade, ranch", price: "8,50", emoji: "🌯" },
];

function BestSellers() {
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
          {BEST_SELLERS.map((item, i) => (
            <motion.div key={item.name} variants={fadeUp} custom={i + 1}>
              <Link href="/menu" className="block">
                <div className="card-premium hover-lift p-0 overflow-hidden cursor-pointer">
                  {/* Image area */}
                  <div className="aspect-square bg-gradient-to-br from-muted to-white flex items-center justify-center">
                    <span className="text-7xl">{item.emoji}</span>
                  </div>
                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-base">{item.name}</h3>
                    <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                      {item.desc}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-brand text-lg">
                        {item.price} &euro;
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
            <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-accent/10 to-muted border border-border overflow-hidden flex items-center justify-center img-premium">
              <div className="text-center text-muted-foreground">
                <Truck className="h-16 w-16 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Photo livreur scooter</p>
              </div>
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
            <h4 className="font-bold text-base mb-1">South Street Food</h4>
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

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <BestSellers />
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
