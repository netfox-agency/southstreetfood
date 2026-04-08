"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-purple-dark via-brand-purple to-brand-purple-light min-h-[90vh] flex items-center">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] w-[600px] h-[600px] rounded-full bg-brand-pink/20 blur-[120px]" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[400px] h-[400px] rounded-full bg-brand-yellow/15 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-6"
            >
              <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
              Ouvert maintenant
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[0.95] tracking-tight">
              Le street food
              <br />
              <span className="text-brand-yellow">de Bayonne</span>
            </h1>

            <p className="mt-6 text-lg text-white/70 max-w-md leading-relaxed">
              Burgers, tacos et wraps artisanaux. Commandez en ligne et
              recuperez au restaurant ou faites-vous livrer sur
              Bayonne-Anglet-Biarritz.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/menu">
                <Button
                  size="lg"
                  className="bg-white text-brand-purple-dark hover:bg-white/90 shadow-lg shadow-black/20 w-full sm:w-auto"
                >
                  Commander maintenant
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/menu">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
                >
                  Voir le menu
                </Button>
              </Link>
            </div>

            {/* Features pills */}
            <div className="mt-10 flex flex-wrap gap-3">
              {[
                {
                  icon: Clock,
                  text: "Jusqu'a 4h du matin",
                },
                {
                  icon: Truck,
                  text: "Livraison BAB",
                },
                {
                  icon: MapPin,
                  text: "Click & Collect",
                },
              ].map((feature) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white/80 text-sm"
                >
                  <feature.icon className="h-3.5 w-3.5 text-brand-yellow" />
                  {feature.text}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Hero Image placeholder - large burger visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="hidden lg:flex items-center justify-center"
          >
            <div className="relative w-[450px] h-[450px]">
              {/* Glow behind the image */}
              <div className="absolute inset-0 rounded-full bg-brand-yellow/20 blur-[60px]" />
              {/* Placeholder circle for burger image */}
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-brand-yellow/30 to-brand-pink/20 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                <div className="text-center text-white/60">
                  <div className="text-7xl mb-2">🍔</div>
                  <p className="text-sm font-medium">Image a venir</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
