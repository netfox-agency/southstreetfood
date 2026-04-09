"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useSpring,
  type MotionValue,
} from "framer-motion";
import {
  ArrowRight,
  Clock,
  MapPin,
  Truck,
  Star,
  ArrowDown,
  Flame,
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
          className={`font-extrabold text-lg tracking-tight transition-colors ${
            scrolled ? "text-foreground" : "text-white"
          }`}
        >
          South Street Food
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/menu"
            className={`text-sm font-medium transition-colors hidden sm:block ${
              scrolled
                ? "text-muted-foreground hover:text-foreground"
                : "text-white/70 hover:text-white"
            }`}
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
   HERO — Fullscreen video + massive staggered title
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Parallax: video drifts slightly, text drifts faster for depth
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-25%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0.65, 1]);

  return (
    <section
      ref={ref}
      className="relative h-[100svh] w-full overflow-hidden bg-black"
    >
      {/* ── Video background ── */}
      <motion.div
        style={{ y: videoY }}
        className="absolute inset-0 w-full h-[115%]"
      >
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

      {/* ── Dark gradient overlay for text legibility ── */}
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/85"
      />
      {/* Side vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%)] pointer-events-none" />

      {/* ── Content ── */}
      <motion.div
        style={{ y: textY }}
        className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6"
      >
        {/* Top eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.2 }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-md"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
          <span className="text-white/80 text-xs font-medium tracking-widest uppercase">
            Bayonne &middot; Anglet &middot; Biarritz
          </span>
        </motion.div>

        {/* Hero title — each word reveals with blur */}
        <h1 className="font-black text-white leading-[0.85] tracking-tighter">
          <motion.span
            initial={{ opacity: 0, y: 60, filter: "blur(24px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease, delay: 0.4 }}
            className="block text-[16vw] sm:text-[13vw] lg:text-[11vw]"
          >
            BAYONNE
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 60, filter: "blur(24px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease, delay: 0.6 }}
            className="block text-[16vw] sm:text-[13vw] lg:text-[11vw] text-brand"
          >
            STREET FOOD
          </motion.span>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 1 }}
          className="mt-8 text-white/70 text-base sm:text-lg max-w-md tracking-wide"
        >
          Burgers smash, tacos généreux & wraps croustillants.
          <br className="hidden sm:block" />
          Livraison jusqu&apos;à 4h du matin.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 1.2 }}
          className="mt-10 flex flex-wrap gap-4 justify-center"
        >
          <Link
            href="/menu"
            className="btn-primary text-base !py-4 !px-10 shadow-[0_0_60px_rgba(232,65,111,0.5)]"
          >
            Je commande
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#manifesto"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-base hover:bg-white/15 transition-all"
          >
            Découvrir
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/50"
      >
        <span className="text-[10px] tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="h-4 w-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MANIFESTO — Marquee + big statement
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Manifesto() {
  const words = [
    "TACOS",
    "BURGERS",
    "WRAPS",
    "BOWLS",
    "FRESH",
    "NIGHT",
    "SMASH",
    "ARTISANAL",
  ];
  // Repeat enough times for seamless loop
  const strip = [...words, ...words, ...words, ...words];

  return (
    <section
      id="manifesto"
      className="relative py-32 sm:py-48 bg-black overflow-hidden"
    >
      {/* Marquee background */}
      <div className="absolute inset-0 flex items-center opacity-[0.06] pointer-events-none select-none">
        <motion.div
          className="flex gap-16 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {strip.map((w, i) => (
            <span
              key={i}
              className="text-white text-[18vw] font-black tracking-tighter leading-none"
            >
              {w} &middot;
            </span>
          ))}
        </motion.div>
      </div>

      {/* Foreground statement */}
      <Reveal className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.p
          variants={fadeUp}
          custom={0}
          className="text-brand font-semibold text-xs sm:text-sm uppercase tracking-[0.3em] mb-8"
        >
          Le manifesto
        </motion.p>
        <motion.h2
          variants={fadeUp}
          custom={1}
          className="text-white font-black text-4xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight"
        >
          Pas de compromis.
          <br />
          Pas de surgelé.
          <br />
          <span className="text-brand">Juste de la vraie</span>
          <br />
          street food.
        </motion.h2>
        <motion.p
          variants={fadeUp}
          custom={2}
          className="mt-10 text-white/50 text-base sm:text-lg max-w-xl mx-auto"
        >
          Des ingrédients frais, des recettes maison, et l&apos;envie
          d&apos;envoyer du lourd à chaque commande.
        </motion.p>
      </Reveal>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PIN SHOWCASE — Scroll-pinned product reveal
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

/** Single slide inside the pinned showcase */
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
  // Each slide occupies 1/total of the scroll and crossfades across ~60% of its window
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
    [0.9, 1, 1, 1.05]
  );
  const y = useTransform(
    progress,
    [start, fadeIn, fadeOut, end],
    [40, 0, 0, -40]
  );

  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 flex items-center"
    >
      <div className="w-full grid lg:grid-cols-2 gap-8 lg:gap-16 items-center px-6 lg:px-16">
        {/* Image */}
        <motion.div
          style={{ scale, y }}
          className="relative aspect-square lg:aspect-auto lg:h-[70vh] w-full max-w-xl mx-auto"
        >
          <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-brand/10 via-transparent to-white/5 blur-2xl" />
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt={item.name}
              className="relative w-full h-full object-contain drop-shadow-[0_30px_60px_rgba(232,65,111,0.25)]"
            />
          ) : (
            <div className="relative flex items-center justify-center w-full h-full text-[200px]">
              🍔
            </div>
          )}
        </motion.div>

        {/* Text */}
        <motion.div style={{ y }} className="text-white lg:pl-8">
          <div className="text-brand font-bold text-sm tracking-[0.25em] uppercase mb-4">
            &mdash; N°{index + 1} / {total}
          </div>
          <h3 className="font-black text-5xl sm:text-6xl lg:text-7xl leading-[0.9] tracking-tight mb-6">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-white/60 text-base sm:text-lg leading-relaxed max-w-md mb-8">
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-6">
            <span className="text-4xl font-black text-brand">
              {formatPrice(item.base_price)} &euro;
            </span>
            <Link
              href={`/item/${item.slug}`}
              className="btn-primary !py-3.5 !px-7 text-sm"
            >
              Composer
              <ArrowRight className="h-4 w-4" />
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
    [0.3, 1, 1, 0.3]
  );
  const scaleX = useTransform(
    progress,
    [index * step, index * step + step * 0.15, (index + 1) * step - step * 0.15, (index + 1) * step],
    [1, 1.4, 1.4, 1]
  );
  return (
    <motion.div
      style={{ opacity, scaleX }}
      className="h-1.5 w-6 rounded-full bg-white origin-left"
    />
  );
}

function Showcase({ items }: { items: BestSellerItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    mass: 0.3,
  });

  if (items.length === 0) return null;
  const total = items.length;

  return (
    <section
      ref={ref}
      className="relative bg-black text-white"
      // Scroll zone: N * 100vh so each slide gets a full viewport of scroll
      style={{ height: `${total * 100}vh` }}
    >
      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent" />

      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/10 rounded-full blur-[200px]" />

        {/* Section label (fixed top-left) */}
        <div className="absolute top-8 left-8 lg:top-12 lg:left-16 z-10 flex items-center gap-3">
          <Flame className="h-4 w-4 text-brand" />
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-white/60">
            Nos incontournables
          </span>
        </div>

        {/* Progress dots (fixed top-right) */}
        <div className="absolute top-8 right-8 lg:top-12 lg:right-16 z-10 hidden sm:flex items-center gap-2">
          {items.map((_, i) => (
            <ProgressDot
              key={i}
              progress={smoothProgress}
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
            progress={smoothProgress}
            index={i}
            total={total}
          />
        ))}
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CONCEPT — Tilt image grid
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Concept() {
  return (
    <Reveal id="concept" className="py-24 sm:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Images — layered */}
          <motion.div variants={fadeUp} custom={0} className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] rounded-3xl bg-gradient-to-br from-brand/10 to-muted flex items-center justify-center text-6xl shadow-lg">
                🍔
              </div>
              <div className="space-y-4">
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-amber-100 to-muted flex items-center justify-center text-5xl shadow-lg">
                  🍟
                </div>
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-orange-100 to-muted flex items-center justify-center text-5xl shadow-lg">
                  🌮
                </div>
              </div>
            </div>
            {/* Floating accent card */}
            <div className="absolute -bottom-4 -left-4 bg-foreground text-background rounded-2xl px-5 py-3 shadow-2xl">
              <div className="text-xs text-white/60 uppercase tracking-wider">
                Depuis
              </div>
              <div className="text-xl font-black">2023</div>
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
              className="text-4xl sm:text-5xl font-black tracking-tight leading-[0.95] mb-6"
            >
              Concept exclusif
              <br />à Bayonne
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-md"
            >
              Notre menu varié vous régale à petit prix, sans contrainte, à
              tout moment de la soirée. Seul, en famille ou entre amis. Des
              ingrédients frais, des recettes qui envoient.
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
   DELIVERY — Dark, night mood, animated stats
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Delivery() {
  return (
    <Reveal className="relative py-24 sm:py-32 bg-black overflow-hidden">
      {/* Animated radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-brand/[0.08] rounded-full blur-[200px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="max-w-3xl">
          <motion.p
            variants={fadeUp}
            custom={0}
            className="text-brand font-semibold text-sm uppercase tracking-[0.25em] mb-6"
          >
            &mdash; Livraison
          </motion.p>
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-white font-black text-5xl sm:text-6xl lg:text-7xl leading-[0.9] tracking-tight mb-8"
          >
            Quand tout le monde
            <br />
            ferme,
            <br />
            <span className="text-brand">on livre.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-white/60 text-lg leading-relaxed mb-16 max-w-lg"
          >
            Ouvert jusqu&apos;à 4h du matin avec livraison rapide sur Bayonne,
            Anglet et Biarritz. En moyenne 30 minutes chez vous.
          </motion.p>
        </div>

        {/* Big stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/10 rounded-3xl overflow-hidden border border-white/10">
          {[
            { value: "30", unit: "MIN", label: "Temps moyen" },
            { value: "4H", unit: "", label: "Ouvert jusqu'à" },
            { value: "BAB", unit: "", label: "Zone couverte" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              custom={3 + i}
              className="bg-black p-8 sm:p-12 flex flex-col justify-between min-h-[200px]"
            >
              <div className="text-white/40 text-xs font-semibold tracking-[0.2em] uppercase">
                {s.label}
              </div>
              <div className="text-white font-black text-6xl sm:text-7xl leading-none tracking-tighter">
                {s.value}
                {s.unit && (
                  <span className="text-brand text-3xl sm:text-4xl ml-1">
                    {s.unit}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FEATURES — Clean 3-column
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
      desc: "Commandez en ligne, on livre chaud chez vous. Bayonne, Anglet, Biarritz et alentours.",
    },
    {
      icon: MapPin,
      title: "Click & Collect",
      desc: "Commandez, choisissez votre créneau, et récupérez au restaurant. Zéro attente.",
    },
  ];

  return (
    <Reveal className="py-24 sm:py-32 bg-white">
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
   CTA — Dramatic full-bleed final section
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function CTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="relative py-32 sm:py-48 bg-black overflow-hidden"
    >
      {/* Animated glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(232,65,111,0.15)_0%,_transparent_70%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 60, filter: "blur(20px)" }}
          animate={
            inView
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: 60, filter: "blur(20px)" }
          }
          transition={{ duration: 1.2, ease, delay: 0.1 }}
          className="text-white font-black text-[20vw] sm:text-[15vw] lg:text-[13vw] leading-[0.85] tracking-tighter"
        >
          AFFAMÉ ?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1, ease, delay: 0.5 }}
          className="text-white/60 text-lg sm:text-xl mt-8 mb-12 max-w-md mx-auto"
        >
          Commandez maintenant et recevez votre commande en 30 minutes, ou
          récupérez-la au restaurant.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={
            inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }
          }
          transition={{ duration: 0.8, ease, delay: 0.7 }}
        >
          <Link
            href="/menu"
            className="btn-primary text-lg !py-5 !px-14 shadow-[0_0_80px_rgba(232,65,111,0.5)]"
          >
            Commander maintenant
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-16 flex flex-wrap justify-center gap-x-8 gap-y-3 text-white/40 text-xs tracking-widest uppercase"
        >
          <span className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Jusqu&apos;à 4h
          </span>
          <span className="flex items-center gap-2">
            <Truck className="h-3 w-3" />
            Livraison 30 min
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            Click & Collect
          </span>
        </motion.div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FOOTER
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Footer() {
  return (
    <footer className="bg-black text-white/60 border-t border-white/10 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-3 gap-12 mb-12">
          <div>
            <h4 className="font-bold text-white text-base mb-2">
              South Street Food
            </h4>
            <p className="text-sm leading-relaxed">
              Le concept street food exclusif de Bayonne. Ouvert jusqu&apos;à
              4h du matin.
            </p>
          </div>
          <div>
            <h4 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5">
              {["La carte", "Commander", "Mon compte"].map((l) => (
                <li key={l}>
                  <Link
                    href="/menu"
                    className="hover:text-white text-sm transition-colors"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">
              Infos
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>Bayonne, France</li>
              <li>Livraison Bayonne &middot; Anglet &middot; Biarritz</li>
              <li className="text-brand font-medium">Ouvert jusqu&apos;à 4h</li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-xs">
            &copy; {new Date().getFullYear()} South Street Food
          </p>
          <div className="flex gap-5">
            <Link
              href="#"
              className="text-white/30 hover:text-white/60 text-xs transition-colors"
            >
              Mentions légales
            </Link>
            <Link
              href="#"
              className="text-white/30 hover:text-white/60 text-xs transition-colors"
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
        <Manifesto />
        <Showcase items={bestSellers} />
        <Concept />
        <Delivery />
        <Features />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
