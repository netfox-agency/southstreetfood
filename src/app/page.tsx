"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Clock,
  MapPin,
  Truck,
  Star,
  ChevronRight,
  Phone,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Animation variants (Apple-level cubic-bezier)
   ───────────────────────────────────────────── */
const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.15, duration: 1.2, ease },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.8, ease },
  }),
};

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─────────────────────────────────────────────
   NAVBAR
   ───────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-nav py-3" : "py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center">
            <span className="text-white font-extrabold text-sm">SS</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-white font-bold text-sm tracking-tight">
              SOUTH STREET
            </span>
            <span className="text-neon-pink font-bold text-[10px] tracking-[0.2em] block leading-none">
              FOOD
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-2">
          <Link
            href="/menu"
            className="px-5 py-2.5 text-sm font-medium text-white/70 hover:text-white rounded-xl hover:bg-white/5 transition-all duration-300"
          >
            Menu
          </Link>
          <Link href="/menu" className="btn-primary text-sm !py-2.5 !px-6">
            Commander
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────
   HERO - Video background + neon logo
   ───────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Video background - using gradient placeholder until real video */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#0a0a12] to-[#0f1a0a]" />
        {/* Neon glow orbs */}
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-neon-pink/8 blur-[150px] animate-blob" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-neon-cyan/8 blur-[120px] animate-blob" style={{ animationDelay: "4s" }} />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-neon-purple/5 blur-[200px]" />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 hero-overlay" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease, delay: 0.2 }}
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full glass mb-10"
        >
          <span className="h-2 w-2 rounded-full bg-neon-green animate-pulse" />
          <span className="text-sm text-white/80 font-medium">
            Ouvert maintenant — livraison jusqu&apos;a 4h
          </span>
        </motion.div>

        {/* Main title - GTA Pricedown style would go here with @font-face */}
        <motion.h1
          initial={{ opacity: 0, y: 60, filter: "blur(20px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.4, ease, delay: 0.4 }}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-[0.85] mb-8"
        >
          <span className="text-white">SOUTH</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan neon-pink">
            STREET FOOD
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease, delay: 0.7 }}
          className="text-lg sm:text-xl text-white/50 max-w-md mx-auto mb-12 leading-relaxed"
        >
          Le concept street food exclusif de Bayonne.
          <br />
          Burgers, tacos &amp; wraps artisanaux.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/menu" className="btn-primary text-base !py-4 !px-10 flex items-center gap-2">
            Je passe commande
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="#concept" className="btn-secondary text-base !py-4 !px-10">
            Decouvrir
          </Link>
        </motion.div>

        {/* Features pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.3 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-16"
        >
          {[
            { icon: Clock, text: "Jusqu'a 4h du matin", color: "text-neon-yellow" },
            { icon: Truck, text: "Livraison BAB", color: "text-neon-cyan" },
            { icon: MapPin, text: "Click & Collect", color: "text-neon-pink" },
          ].map((f) => (
            <div
              key={f.text}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-sm text-white/60"
            >
              <f.icon className={`h-3.5 w-3.5 ${f.color}`} />
              {f.text}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full bg-neon-pink"
          />
        </div>
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Livraison toute la nuit
   ───────────────────────────────────────────── */
function DeliverySection() {
  return (
    <Section className="section-padding relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-pink/5 rounded-full blur-[200px]" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Text */}
          <div>
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-sm font-medium mb-6"
            >
              <Truck className="h-3.5 w-3.5" />
              Livraison
            </motion.div>

            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95] mb-6"
            >
              Livraison
              <br />
              <span className="text-neon-pink neon-pink">toute la nuit</span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg text-white/50 leading-relaxed max-w-md mb-8"
            >
              Nous sommes ouvert jusqu&apos;a{" "}
              <span className="text-neon-yellow font-semibold">4h du matin</span>{" "}
              avec une livraison sur tout le BAB et ses alentours.
              Bayonne, Anglet, Biarritz.
            </motion.p>

            <motion.div variants={fadeUp} custom={3}>
              <Link
                href="/menu"
                className="btn-primary inline-flex items-center gap-2"
              >
                Commander maintenant
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>

          {/* Image - Delivery rider */}
          <motion.div variants={scaleIn} custom={2} className="relative">
            <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-dark-elevated to-dark-surface overflow-hidden img-neon-border">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white/20">
                  <Truck className="h-16 w-16 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Image livreur a ajouter</p>
                </div>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 glass-strong rounded-2xl px-5 py-3 neon-glow-pink">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-neon-pink" />
                <div>
                  <div className="text-white font-bold text-sm">30 min</div>
                  <div className="text-white/40 text-xs">Temps moyen</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Concept exclusif
   ───────────────────────────────────────────── */
function ConceptSection() {
  return (
    <Section id="concept" className="section-padding relative overflow-hidden">
      <div className="absolute left-0 top-0 w-[400px] h-[400px] bg-neon-purple/5 rounded-full blur-[180px]" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Images grid */}
          <motion.div variants={scaleIn} custom={0} className="relative order-2 lg:order-1">
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3 aspect-[3/4] rounded-3xl bg-gradient-to-br from-dark-elevated to-dark-surface overflow-hidden img-glow">
                <div className="h-full flex items-center justify-center text-6xl">🍔</div>
              </div>
              <div className="col-span-2 flex flex-col gap-4">
                <div className="flex-1 rounded-3xl bg-gradient-to-br from-dark-elevated to-dark-surface overflow-hidden img-glow">
                  <div className="h-full flex items-center justify-center text-4xl">🍟</div>
                </div>
                <div className="flex-1 rounded-3xl bg-gradient-to-br from-dark-elevated to-dark-surface overflow-hidden img-glow">
                  <div className="h-full flex items-center justify-center text-4xl">🌮</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <div className="order-1 lg:order-2">
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-sm font-medium mb-6"
            >
              <Star className="h-3.5 w-3.5" />
              Concept
            </motion.div>

            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95] mb-6"
            >
              Concept exclusif
              <br />
              <span className="text-neon-cyan neon-cyan">a Bayonne</span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg text-white/50 leading-relaxed max-w-md mb-8"
            >
              Notre menu varie vous regale a petit prix, sans contrainte,
              a tout moment de la soiree, que vous soyez seul, en famille
              ou entre amis.
            </motion.p>

            <motion.div variants={fadeUp} custom={3}>
              <Link
                href="/menu"
                className="btn-secondary inline-flex items-center gap-2"
              >
                Voir la carte
                <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Features (3 cards)
   ───────────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    {
      icon: Star,
      title: "Qualite artisanale",
      desc: "Des ingredients frais selectionnes et des recettes elaborees pour un street food d'exception.",
      color: "text-neon-yellow",
      glow: "bg-neon-yellow/10",
    },
    {
      icon: Truck,
      title: "Livraison rapide",
      desc: "Livraison dans toute la zone BAB. Chez vous en 30 minutes, chaud et pret a deguster.",
      color: "text-neon-cyan",
      glow: "bg-neon-cyan/10",
    },
    {
      icon: MapPin,
      title: "Click & Collect",
      desc: "Commandez en ligne et recuperez votre commande directement au restaurant. Zero attente.",
      color: "text-neon-pink",
      glow: "bg-neon-pink/10",
    },
  ];

  return (
    <Section className="section-padding">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-4xl sm:text-5xl font-black tracking-tight mb-4"
          >
            Pourquoi nous choisir
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            className="text-white/40 text-lg max-w-md mx-auto"
          >
            Le meilleur du street food, a portee de clic
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} variants={scaleIn} custom={i}>
              <div className="glass-card p-8 h-full text-center">
                <div
                  className={`inline-flex items-center justify-center h-14 w-14 rounded-2xl ${f.glow} mb-6`}
                >
                  <f.icon className={`h-7 w-7 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">
                  {f.title}
                </h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────
   SECTION: Le restaurant
   ───────────────────────────────────────────── */
function RestaurantSection() {
  return (
    <Section className="section-padding relative overflow-hidden">
      <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-neon-purple/5 rounded-full blur-[200px]" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-4xl sm:text-5xl font-black tracking-tight mb-4"
          >
            Sur place ou a emporter
          </motion.h2>
        </div>

        <motion.div
          variants={scaleIn}
          custom={1}
          className="relative rounded-3xl overflow-hidden img-neon-border"
        >
          <div className="aspect-[21/9] bg-gradient-to-br from-dark-elevated to-dark-surface flex items-center justify-center">
            <div className="text-center text-white/20">
              <MapPin className="h-16 w-16 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Photo du restaurant a ajouter</p>
            </div>
          </div>
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
            <p className="text-white/60 text-sm mb-2">Restaurant</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              South Street Food — Bayonne
            </h3>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────
   SECTION: CTA Final
   ───────────────────────────────────────────── */
function CTASection() {
  return (
    <Section className="section-padding">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          variants={scaleIn}
          custom={0}
          className="relative rounded-3xl overflow-hidden p-12 sm:p-20 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(252,81,133,0.15) 0%, rgba(103,61,230,0.15) 50%, rgba(0,229,255,0.1) 100%)",
          }}
        >
          {/* Border glow */}
          <div className="absolute inset-0 rounded-3xl border border-neon-pink/20" />

          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6"
          >
            Une faim de
            <br />
            <span className="text-neon-pink neon-pink">loup ?</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-lg text-white/50 mb-10 max-w-md mx-auto"
          >
            Commandez maintenant et recevez votre commande en 30 minutes.
            Ou recuperez-la au restaurant.
          </motion.p>
          <motion.div variants={fadeUp} custom={3}>
            <Link
              href="/menu"
              className="btn-primary text-lg !py-5 !px-12 inline-flex items-center gap-3"
            >
              Commander maintenant
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────
   FOOTER
   ───────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center">
                <span className="text-white font-extrabold text-sm">SS</span>
              </div>
              <div>
                <span className="text-white font-bold text-sm">SOUTH STREET</span>
                <span className="text-neon-pink font-bold text-[10px] tracking-[0.2em] block leading-none">FOOD</span>
              </div>
            </div>
            <p className="text-white/30 text-sm leading-relaxed">
              Le concept street food exclusif de Bayonne.
              Ouvert jusqu&apos;a 4h du matin.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <ul className="space-y-3">
              {["Menu", "Commander", "Mon compte"].map((link) => (
                <li key={link}>
                  <Link
                    href="/menu"
                    className="text-white/30 hover:text-white text-sm transition-colors duration-300"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-white/30">
              <li>Bayonne, France</li>
              <li>Livraison Bayonne · Anglet · Biarritz</li>
              <li className="text-neon-green font-medium">Ouvert jusqu&apos;a 4h</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/20 text-xs">
            &copy; {new Date().getFullYear()} South Street Food. Tous droits reserves.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-white/20 hover:text-white/50 text-xs transition-colors">
              Mentions legales
            </Link>
            <Link href="#" className="text-white/20 hover:text-white/50 text-xs transition-colors">
              CGV
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <DeliverySection />
        <ConceptSection />
        <FeaturesSection />
        <RestaurantSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
