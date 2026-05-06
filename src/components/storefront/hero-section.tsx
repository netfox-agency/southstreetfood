"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Clock, MapPin, Truck } from "lucide-react";

// Video hebergee sur Supabase Storage (bucket public site-assets) pour
// garder le repo git leger.
const HERO_VIDEO =
  "https://exwfddsyavnlntnogpoz.supabase.co/storage/v1/object/public/site-assets/hero-video.mp4";

/**
 * Hero refonte — Pricedown reveal + parallax subtil au scroll.
 *
 * Design intent :
 *   - Title Pricedown (DA client) avec brand pink en accent → identite forte
 *   - Parallax doux du contenu (translate Y -80px max) → "premium" feel
 *   - Fade-out du contenu pendant le scroll → laisse respirer le contenu en dessous
 *   - CTA rounded-full glassy qui parle le meme langage que la navbar
 *   - Pills features en bas avec stagger reveal
 */
export function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Parallax : contenu monte plus vite que la video → effet profondeur
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden min-h-[92vh] flex items-center bg-black"
    >
      {/* ── Video de fond avec subtle scale on scroll (parallax inverse) ── */}
      <motion.div
        className="absolute inset-0"
        style={{ scale: videoScale }}
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      </motion.div>

      {/* ── Dark overlay gradient ── */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* ── Halo brand pink en bas a droite, tres subtil ── */}
      <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-[#e8416f]/20 blur-[120px] pointer-events-none" />

      {/* ── Contenu avec parallax + fade-out ── */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 w-full"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          {/* Pill "Ouvert maintenant" — glassy, brand pink dot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-2xl border border-white/15 text-white/90 text-[13px] font-medium mb-7 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#e8416f] opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e8416f]" />
            </span>
            Ouvert maintenant
          </motion.div>

          {/* Title Pricedown — DA client. Brand pink accent. */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[64px] sm:text-[88px] lg:text-[120px] leading-[0.92] tracking-tight text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          >
            Le street food
            <br />
            <span className="text-[#e8416f]">de Bayonne</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-7 text-base sm:text-lg text-white/85 max-w-md leading-relaxed drop-shadow-md"
          >
            Burgers, tacos et wraps artisanaux. Commandez en ligne et
            recuperez au restaurant ou faites-vous livrer sur
            Bayonne-Anglet-Biarritz.
          </motion.p>

          {/* CTAs — meme langage que la navbar (rounded-full, hauteur 12) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="mt-9 flex flex-col sm:flex-row gap-3"
          >
            <Link
              href="/menu"
              className="group inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-white text-[#0a0a0a] text-[14px] font-semibold shadow-[0_12px_32px_-8px_rgba(255,255,255,0.4)] hover:shadow-[0_16px_40px_-8px_rgba(255,255,255,0.5)] active:scale-[0.97] transition-all duration-300"
            >
              Commander maintenant
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 text-white text-[14px] font-semibold hover:bg-white/15 active:scale-[0.97] transition-all duration-300"
            >
              Voir le menu
            </Link>
          </motion.div>

          {/* Features pills — stagger */}
          <div className="mt-10 flex flex-wrap gap-2.5">
            {[
              { icon: Clock, text: "Jusqu'a 4h du matin" },
              { icon: Truck, text: "Livraison BAB" },
              { icon: MapPin, text: "Click & Collect" },
            ].map((feature, i) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.08, duration: 0.4 }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-2xl border border-white/15 text-white/90 text-[12.5px] font-medium"
              >
                <feature.icon className="h-3.5 w-3.5 text-[#e8416f]" />
                {feature.text}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator subtle, en bas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        style={{ opacity: contentOpacity }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="h-9 w-5 rounded-full border border-white/30 flex items-start justify-center p-1.5">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="h-1.5 w-1 rounded-full bg-white/70"
          />
        </div>
      </motion.div>
    </section>
  );
}
