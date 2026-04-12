"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";

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
   HERO
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
      {/* Gradient */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Mobile: centered — Desktop: bottom-left */}
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
          Livr&eacute; chez vous jusqu&apos;&agrave; 4h.
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
            href="/menu"
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
   BEST SELLERS
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
    <Reveal className="py-24 sm:py-32 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div variants={fadeUp} custom={0} className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Nos incontournables
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item, i) => (
            <motion.div key={item.id} variants={fadeUp} custom={i + 1}>
              <Link href={`/item/${item.slug}`} className="block group">
                <div className="rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 cursor-pointer">
                  {/* Image area */}
                  <div className="aspect-square overflow-hidden">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/[0.03] flex items-center justify-center">
                        <span className="text-7xl">&#127828;</span>
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-medium text-white text-base line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-white/40 text-sm mt-1 line-clamp-2 min-h-[2.5rem] font-light">
                      {item.description || ""}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-medium text-white text-lg">
                        {formatPrice(item.base_price)} &euro;
                      </span>
                      <span className="h-9 w-9 rounded-full bg-white/[0.08] text-white/60 flex items-center justify-center text-lg group-hover:bg-white/[0.15] transition-colors">
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
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white/60 hover:text-white rounded-full border border-white/[0.12] hover:border-white/[0.25] transition-all duration-300"
          >
            Voir toute la carte
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </Reveal>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DELIVERY
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Delivery() {
  return (
    <Reveal className="py-24 sm:py-32 bg-[#111]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[0.95] mb-6 text-white"
            >
              Livraison toute
              <br />
              la nuit
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-white/45 text-lg leading-relaxed mb-8 max-w-md font-light"
            >
              Ouvert jusqu&apos;&agrave; 4h du matin avec livraison rapide
              sur Bayonne, Anglet et Biarritz. En moyenne 30 minutes
              chez vous.
            </motion.p>

            {/* Stats */}
            <motion.div
              variants={fadeUp}
              custom={2}
              className="grid grid-cols-3 gap-6"
            >
              {[
                { value: "30", unit: "min", label: "Temps moyen" },
                { value: "4h", unit: "", label: "Ouvert jusqu\u2019\u00e0" },
                { value: "BAB", unit: "", label: "Zone couverte" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-semibold text-white">
                    {s.value}
                    <span className="text-lg font-light">{s.unit}</span>
                  </div>
                  <div className="text-white/35 text-sm mt-1 font-light">
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Image */}
          <motion.div variants={fadeUp} custom={2}>
            <div className="aspect-[16/9] rounded-2xl overflow-hidden relative border border-white/[0.06]">
              <Image
                src="/delivery-van.png"
                alt="Camionette de livraison South Speed Food sur la c&ocirc;te basque"
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
   CTA Final
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function CTA() {
  return (
    <Reveal className="py-24 sm:py-32 bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.h2
          variants={fadeUp}
          custom={0}
          className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6 text-white"
        >
          Votre commande vous attend.
        </motion.h2>
        <motion.p
          variants={fadeUp}
          custom={1}
          className="text-white/40 text-lg mb-10 max-w-md mx-auto font-light"
        >
          Livraison en 30 minutes ou retrait au restaurant.
        </motion.p>
        <motion.div variants={fadeUp} custom={2}>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-medium text-white bg-white/[0.1] hover:bg-white/[0.18] rounded-full border border-white/[0.2] backdrop-blur-md transition-all duration-300"
          >
            Commander maintenant
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </Reveal>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PAGE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function HomeClient({ bestSellers }: { bestSellers: BestSellerItem[] }) {
  return (
    <>
      <Hero />
      <BestSellers items={bestSellers} />
      <Delivery />
      <CTA />
    </>
  );
}
