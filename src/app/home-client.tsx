"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Clock,
  MapPin,
  Truck,
  Star,
  Quote,
} from "lucide-react";

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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md mb-6"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand" />
              </span>
              <span className="text-white/80 text-[11px] font-medium tracking-[0.12em] uppercase">
                Bayonne &middot; Anglet &middot; Biarritz
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.2, ease, delay: 0.3 }}
              className="text-5xl sm:text-6xl lg:text-[88px] font-extrabold text-white leading-[0.95] tracking-[-0.035em]"
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
              className="mt-7 text-white/55 text-[17px] leading-[1.55] max-w-md"
            >
              Le concept street food exclusif de Bayonne.
              Livraison jusqu&apos;à 4h du matin sur tout le BAB.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.8 }}
              className="mt-10 flex flex-wrap gap-3"
            >
              <Link href="/menu" className="btn-primary text-base !py-4 !px-8">
                Je commande
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#concept"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl border border-white/15 text-white text-[15px] font-semibold hover:border-white/40 transition-colors"
              >
                Découvrir
              </Link>
            </motion.div>

            {/* Minimal info chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="mt-14 flex flex-wrap gap-x-8 gap-y-3"
            >
              {[
                { icon: Clock, text: "Jusqu'à 4h" },
                { icon: Truck, text: "Livraison 30 min" },
                { icon: MapPin, text: "Click & Collect" },
              ].map((f) => (
                <span
                  key={f.text}
                  className="flex items-center gap-2 text-white/40 text-[12px] font-medium tracking-wide"
                >
                  <f.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {f.text}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right — Hero video */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease, delay: 0.5 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="aspect-square rounded-[32px] border border-white/[0.06] overflow-hidden shadow-2xl shadow-black/40">
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
   CONCEPT — Le concept (real product images)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Concept({ items }: { items: BestSellerItem[] }) {
  // Pick up to 3 visuals from real best sellers, fallback gracefully
  const visuals = items.slice(0, 3);

  return (
    <Reveal id="concept" className="dark-section py-28 sm:py-36">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Images — real product shots in a layered Apple grid */}
          <motion.div variants={fadeUp} custom={0}>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] rounded-3xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
                {visuals[0]?.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={visuals[0].image_url}
                    alt={visuals[0].name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
                    🍔
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="aspect-square rounded-3xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
                  {visuals[1]?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={visuals[1].image_url}
                      alt={visuals[1].name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">
                      🍟
                    </div>
                  )}
                </div>
                <div className="aspect-square rounded-3xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
                  {visuals[2]?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={visuals[2].image_url}
                      alt={visuals[2].name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">
                      🌮
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <div>
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-brand font-semibold text-[11px] uppercase tracking-[0.18em] mb-5"
            >
              Le concept
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-[-0.035em] text-white leading-[0.95] mb-6"
            >
              Exclusif.
              <br />
              <span className="text-white/60">Sans compromis.</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-white/55 text-[17px] leading-[1.55] mb-10 max-w-md"
            >
              Ingrédients frais, recettes signature, service jusqu&apos;à
              4h. Une expérience street food pensée comme un produit&nbsp;:
              simple, précise, obsessionnelle.
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
   LIVRAISON — Full width Apple-grade stats band
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Delivery() {
  const stats = [
    { value: "30", unit: "min", label: "Temps moyen de livraison" },
    { value: "4h", unit: "", label: "Service jusqu'à" },
    { value: "3", unit: "villes", label: "Bayonne · Anglet · Biarritz" },
    { value: "500", unit: "+", label: "Avis 4.8/5" },
  ];

  return (
    <Reveal className="py-28 sm:py-36 bg-muted">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          variants={fadeUp}
          custom={0}
          className="max-w-3xl mb-16"
        >
          <p className="text-brand font-semibold text-[11px] uppercase tracking-[0.18em] mb-5">
            Livraison
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-[-0.035em] leading-[0.95]">
            Chaud, rapide,
            <br />
            <span className="text-muted-foreground">toute la nuit.</span>
          </h2>
          <p className="text-muted-foreground text-[17px] leading-[1.55] mt-6 max-w-xl">
            Commande passée, commande partie. Un réseau logistique
            calibré pour livrer vos burgers, tacos et wraps chauds,
            partout sur le BAB, jusqu&apos;à 4h du matin.
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          variants={fadeUp}
          custom={1}
          className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-3xl overflow-hidden border border-border"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-background p-8 flex flex-col justify-between min-h-[180px]"
            >
              <div className="text-5xl sm:text-6xl font-extrabold tracking-[-0.04em] text-foreground">
                {s.value}
                <span className="text-2xl text-brand ml-1">{s.unit}</span>
              </div>
              <div className="text-muted-foreground text-[12px] font-medium tracking-wide mt-4">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
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
      title: "Qualité artisanale",
      desc: "Ingrédients frais sélectionnés chaque jour. Recettes signature taillées pour le goût, pas pour les marges.",
    },
    {
      icon: Truck,
      title: "Livraison 30 min",
      desc: "Commande en ligne, livraison chaude à domicile. Bayonne, Anglet, Biarritz, jusqu'à 4h du matin.",
    },
    {
      icon: MapPin,
      title: "Click & Collect",
      desc: "Commande, créneau, récupération. Zéro attente, zéro friction, tout pensé pour aller vite.",
    },
  ];

  return (
    <Reveal className="py-28 sm:py-36">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div variants={fadeUp} custom={0} className="max-w-2xl mb-16">
          <p className="text-brand font-semibold text-[11px] uppercase tracking-[0.18em] mb-5">
            L&apos;expérience
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.035em] leading-[0.95]">
            Pensé comme un
            <br />
            <span className="text-muted-foreground">produit premium.</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5">
          {items.map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} custom={i + 1}>
              <div className="card-premium p-8 h-full">
                <div className="h-11 w-11 rounded-2xl bg-brand/[0.08] flex items-center justify-center mb-6">
                  <f.icon className="h-5 w-5 text-brand" strokeWidth={2} />
                </div>
                <h3 className="font-bold text-[17px] tracking-[-0.01em] mb-2">
                  {f.title}
                </h3>
                <p className="text-muted-foreground text-[14px] leading-[1.55]">
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
   TESTIMONIALS — Social proof franchise
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Testimonials() {
  const reviews = [
    {
      quote:
        "Les meilleurs tacos de Bayonne. Service rapide, produit au top, je commande toutes les semaines.",
      author: "Lucas M.",
      role: "Bayonne",
    },
    {
      quote:
        "Enfin un fast food qui envoie vraiment. Les burgers sont énormes et la livraison impec à 2h du mat.",
      author: "Sarah D.",
      role: "Anglet",
    },
    {
      quote:
        "Carte variée, ingrédients frais, interface de commande ultra fluide. Du très haut niveau.",
      author: "Théo R.",
      role: "Biarritz",
    },
  ];

  return (
    <Reveal className="py-28 sm:py-36 bg-muted">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div variants={fadeUp} custom={0} className="max-w-2xl mb-16">
          <p className="text-brand font-semibold text-[11px] uppercase tracking-[0.18em] mb-5">
            Ils en parlent
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.035em] leading-[0.95]">
            4.8/5 sur
            <br />
            <span className="text-muted-foreground">+500 avis.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {reviews.map((r, i) => (
            <motion.div key={r.author} variants={fadeUp} custom={i + 1}>
              <div className="card-premium p-8 h-full flex flex-col">
                <Quote
                  className="h-6 w-6 text-brand mb-5"
                  strokeWidth={2}
                />
                <p className="text-foreground text-[15px] leading-[1.6] flex-1">
                  {r.quote}
                </p>
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-1.5 mb-2">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className="h-3.5 w-3.5 text-brand fill-brand"
                      />
                    ))}
                  </div>
                  <div className="font-semibold text-[14px] tracking-[-0.01em]">
                    {r.author}
                  </div>
                  <div className="text-muted-foreground text-[12px]">
                    {r.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CTA Final — Dark, full-bleed, Apple-grade
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function CTA() {
  return (
    <Reveal className="dark-section py-28 sm:py-40 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a14] via-[#0a0a10] to-[#0a1414]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand/[0.06] rounded-full blur-[180px]" />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.p
          variants={fadeUp}
          custom={0}
          className="text-brand font-semibold text-[11px] uppercase tracking-[0.18em] mb-6"
        >
          C&apos;est l&apos;heure
        </motion.p>
        <motion.h2
          variants={fadeUp}
          custom={1}
          className="text-5xl sm:text-6xl lg:text-[80px] font-extrabold tracking-[-0.035em] leading-[0.95] text-white mb-6"
        >
          Une faim
          <br />
          <span className="text-brand">de loup&nbsp;?</span>
        </motion.h2>
        <motion.p
          variants={fadeUp}
          custom={2}
          className="text-white/55 text-[17px] leading-[1.55] mb-12 max-w-md mx-auto"
        >
          Commande en ligne, livraison en 30 minutes, ou récupération
          express au restaurant.
        </motion.p>
        <motion.div
          variants={fadeUp}
          custom={3}
          className="flex flex-wrap gap-3 justify-center"
        >
          <Link href="/menu" className="btn-primary text-base !py-4 !px-8">
            Commander maintenant
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#concept"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl border border-white/15 text-white text-[15px] font-semibold hover:border-white/40 transition-colors"
          >
            Voir le concept
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
    <footer className="border-t border-border py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-3 gap-12 mb-16">
          <div>
            <h4 className="font-extrabold text-[15px] tracking-[-0.01em] mb-2">
              South Street Food
            </h4>
            <p className="text-muted-foreground text-[13px] leading-[1.6] max-w-xs">
              Le concept street food exclusif de Bayonne.
              Ouvert jusqu&apos;à 4h du matin.
            </p>
          </div>
          <div>
            <h4 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em] mb-5">
              Navigation
            </h4>
            <ul className="space-y-3">
              {["La carte", "Commander", "Mon compte"].map((l) => (
                <li key={l}>
                  <Link
                    href="/menu"
                    className="text-foreground/80 hover:text-foreground text-[13px] font-medium transition-colors"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em] mb-5">
              Infos
            </h4>
            <ul className="space-y-3 text-[13px] text-foreground/80">
              <li>Bayonne, France</li>
              <li>Livraison Bayonne &middot; Anglet &middot; Biarritz</li>
              <li className="text-brand font-semibold">
                Ouvert jusqu&apos;à 4h
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground/60 text-[11px] tracking-wide">
            &copy; {new Date().getFullYear()} South Street Food &mdash; Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-muted-foreground/60 hover:text-foreground text-[11px] tracking-wide transition-colors"
            >
              Mentions légales
            </Link>
            <Link
              href="#"
              className="text-muted-foreground/60 hover:text-foreground text-[11px] tracking-wide transition-colors"
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
        <BestSellers items={bestSellers} />
        <Concept items={bestSellers} />
        <Delivery />
        <Features />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
