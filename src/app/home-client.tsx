"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, MapPin, X } from "lucide-react";
import { DELIVERY_ZONES } from "@/lib/constants";

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
      {/* ── Video hero : compressee 720p H.264 ~0.9 MB, + poster JPG 71 KB
          (affichage instantane), hebergees sur Supabase Storage.
          - autoPlay + muted + playsInline = autoplay ok sur iOS/Android
          - preload="auto" = commence le DL asap (safe, fichier leger)
          - +faststart cote encoding = joue des les premiers KB recus
          - object-position different mobile/desktop via classes responsives */}
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover object-[center_20%] sm:object-center"
        src="https://exwfddsyavnlntnogpoz.supabase.co/storage/v1/object/public/site-assets/hero-video.mp4"
        poster="https://exwfddsyavnlntnogpoz.supabase.co/storage/v1/object/public/site-assets/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      {/* Gradient */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Mobile: centered — Desktop: bottom-left */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center sm:items-start sm:justify-end px-6 sm:px-12 lg:px-16 pt-16 sm:pb-16 text-white">
        {/* Hero : Pricedown (GTA) mais traite avec la rigueur Apple.
            - Font-display uniforme (pas de melange font / italic, ca ne
              rendrait pas avec une display face genre Pricedown qui n'a
              qu'une graisse)
            - Une seule ligne sur desktop via whitespace-nowrap sm+, wrap
              naturel sur mobile
            - Blanc pur, drop-shadow leger pour la lisibilite sur la video.
              Zero effet chrome, zero stroke, zero gradient kitsch.
            - Tailles escaladees du mobile au xl pour garder un rythme
              harmonieux sans jamais ecraser la video */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease, delay: 0.3 }}
          className="font-display text-center sm:text-left text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl text-white leading-[0.95] tracking-wide uppercase sm:whitespace-nowrap drop-shadow-[0_4px_20px_rgba(0,0,0,0.55)]"
        >
          Le go&ucirc;t du sud
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.7 }}
          className="mt-5 text-center sm:text-left text-white/80 text-base sm:text-lg font-light max-w-md leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
        >
          Livr&eacute; chez vous jusqu&apos;&agrave; 4h.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 1 }}
          className="mt-8 flex items-center gap-5"
        >
          {/* Bouton principal : blanc solide sur fond dark, pattern Apple
              classique. Plus de contraste et de clarte qu'un glass-effect
              qui se perd dans la video. */}
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-7 py-3 text-sm font-medium text-black bg-white hover:bg-white/90 rounded-full shadow-lg shadow-black/20 transition-all duration-300"
          >
            Commander
            <ArrowRight className="h-4 w-4" />
          </Link>
          {/* Lien secondaire ghost, style Apple "Learn more >" */}
          <a
            href="#best-sellers"
            className="text-sm text-white/70 hover:text-white font-light transition-colors hidden sm:inline-flex items-center gap-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
          >
            Nos incontournables
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
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
    <Reveal id="best-sellers" className="py-24 sm:py-32 bg-[#f9f9f9]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div variants={fadeUp} custom={0} className="mb-12">
          <h2 className="font-display text-4xl sm:text-5xl text-foreground leading-[1] tracking-wide uppercase">
            Nos incontournables
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <motion.div key={item.id} variants={fadeUp} custom={i + 1}>
              <Link href={`/item/${item.slug}`} className="block group">
                <div className="rounded-2xl overflow-hidden bg-white border border-border shadow-sm hover:border-foreground/15 hover:shadow-lg transition-all duration-300 cursor-pointer">
                  {/* Image area */}
                  <div className="aspect-square overflow-hidden bg-muted">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-7xl">&#127828;</span>
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-medium text-foreground text-base line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1 line-clamp-2 min-h-[2.5rem] font-light">
                      {item.description || ""}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-medium text-foreground text-lg">
                        {formatPrice(item.base_price)} &euro;
                      </span>
                      <span className="h-9 w-9 rounded-full bg-brand/10 text-brand flex items-center justify-center text-lg group-hover:bg-brand/20 transition-colors">
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
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-brand hover:text-brand-dark rounded-full border border-brand/30 hover:border-brand/60 hover:shadow-sm transition-all duration-300"
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
  const [zonesOpen, setZonesOpen] = useState(false);

  return (
    <Reveal className="py-24 sm:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-display text-4xl sm:text-5xl leading-[1] tracking-wide mb-6 text-foreground uppercase"
            >
              Livraison toute
              <br />
              la nuit
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-md font-light"
            >
              Ouvert jusqu&apos;&agrave; 4h du matin avec livraison rapide
              sur Bayonne, Anglet, Biarritz et leurs alentours. En moyenne
              40 minutes chez vous.
            </motion.p>

            {/* Stats */}
            <motion.div
              variants={fadeUp}
              custom={2}
              className="grid grid-cols-3 gap-6"
            >
              <div>
                <div className="text-3xl font-semibold text-foreground">
                  40
                  <span className="text-lg font-light">min</span>
                </div>
                <div className="text-muted-foreground text-sm mt-1 font-light">
                  Temps moyen
                </div>
              </div>
              <div>
                <div className="text-3xl font-semibold text-foreground">
                  4h
                </div>
                <div className="text-muted-foreground text-sm mt-1 font-light">
                  Ouvert jusqu&apos;&agrave;
                </div>
              </div>
              {/* Zone couverte — cliquable, ouvre le modal des villes */}
              <button
                type="button"
                onClick={() => setZonesOpen(true)}
                className="text-left group cursor-pointer"
                aria-label="Voir toutes les villes livrees"
              >
                <div className="text-3xl font-semibold text-foreground group-hover:text-brand transition-colors">
                  BAB
                  <span className="text-lg font-light">+</span>
                </div>
                <div className="text-muted-foreground text-sm mt-1 font-light group-hover:text-brand transition-colors inline-flex items-center gap-1">
                  Et alentours
                  <ArrowRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </motion.div>
          </div>

          {/* Image */}
          <motion.div variants={fadeUp} custom={2}>
            <div className="aspect-[16/9] rounded-2xl overflow-hidden relative border border-border">
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

      {/* Modal : liste de toutes les villes livrees, groupees par zone/prix */}
      <DeliveryZonesModal open={zonesOpen} onClose={() => setZonesOpen(false)} />
    </Reveal>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DELIVERY ZONES MODAL
   Affiche toutes les villes livrees groupees par zone tarifaire.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function DeliveryZonesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Lock body scroll + close on Escape when open
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border">
              <div>
                <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wide text-foreground leading-none">
                  Zones de livraison
                </h3>
                <p className="text-sm text-muted-foreground mt-2 font-light">
                  On livre sur Bayonne, Anglet, Biarritz et les communes
                  alentour. Frais selon la zone.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 h-8 w-8 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>

            {/* Zones groupees par tarif */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <ul className="space-y-5">
                {DELIVERY_ZONES.map((zone) => (
                  <li key={zone.fee}>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                        Zone {(zone.fee / 100).toFixed(0)} &euro;
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {zone.cities.length}{" "}
                        {zone.cities.length > 1 ? "communes" : "commune"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {zone.cities.map((city) => (
                        <span
                          key={city}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm text-foreground"
                        >
                          <MapPin className="h-3 w-3 text-brand" />
                          {city}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer CTA */}
            <div className="px-6 pb-6 pt-4 border-t border-border">
              <Link
                href="/menu"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Commander
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CTA Final
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function CTA() {
  return (
    <Reveal className="py-24 sm:py-32 bg-brand">
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
          className="text-white/70 text-lg mb-10 max-w-md mx-auto font-light"
        >
          Livraison en 30 minutes ou retrait au restaurant.
        </motion.p>
        <motion.div variants={fadeUp} custom={2}>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-brand bg-white hover:bg-white/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
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
