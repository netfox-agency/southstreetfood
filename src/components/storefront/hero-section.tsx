"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

// Video hebergee sur Supabase Storage (bucket public site-assets) pour
// garder le repo git leger. Cache-control immutable cote Supabase, donc
// un hash dans l'URL suffirait pour forcer un refresh si besoin.
const HERO_VIDEO =
  "https://exwfddsyavnlntnogpoz.supabase.co/storage/v1/object/public/site-assets/hero-video.mp4";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center bg-black">
      {/* ── Video de fond ──
          - muted + autoPlay + playsInline : passe la policy iOS / Chrome mobile
          - loop : joue en boucle sans interaction
          - preload="metadata" : recupere juste dimensions + premiere frame,
            pas les 34 MB entiers tant que le player n'a pas decide de jouer
          - object-cover : remplit tout le cadre sans deformer */}
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

      {/* ── Dark overlay gradient ──
          Plus dense a gauche (sous le texte) et plus transparent a droite
          (on voit mieux la video). Deuxieme gradient bottom → top pour
          garantir la lisibilite des pills features en bas. */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* ── Contenu ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm mb-6"
          >
            <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
            Ouvert maintenant
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[0.95] tracking-tight drop-shadow-lg">
            Le street food
            <br />
            <span className="text-brand-yellow">de Bayonne</span>
          </h1>

          <p className="mt-6 text-lg text-white/85 max-w-md leading-relaxed drop-shadow-md">
            Burgers, tacos et wraps artisanaux. Commandez en ligne et
            recuperez au restaurant ou faites-vous livrer sur
            Bayonne-Anglet-Biarritz.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/menu">
              <Button
                size="lg"
                className="bg-white text-brand-purple-dark hover:bg-white/90 shadow-xl shadow-black/30 w-full sm:w-auto"
              >
                Commander maintenant
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/menu">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white bg-white/5 backdrop-blur-sm hover:bg-white/15 w-full sm:w-auto"
              >
                Voir le menu
              </Button>
            </Link>
          </div>

          {/* Features pills */}
          <div className="mt-10 flex flex-wrap gap-3">
            {[
              { icon: Clock, text: "Jusqu'a 4h du matin" },
              { icon: Truck, text: "Livraison BAB" },
              { icon: MapPin, text: "Click & Collect" },
            ].map((feature) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/15 text-white/90 text-sm"
              >
                <feature.icon className="h-3.5 w-3.5 text-brand-yellow" />
                {feature.text}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
