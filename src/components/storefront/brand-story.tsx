"use client";

import { motion } from "framer-motion";
import { MapPin, Clock, Truck, Star } from "lucide-react";

const features = [
  {
    icon: Star,
    title: "Qualite artisanale",
    description:
      "Des ingredients frais et des recettes elaborees pour un street food d'exception.",
    color: "text-brand-yellow",
  },
  {
    icon: Clock,
    title: "Ouvert tard",
    description:
      "Commandez jusqu'a 4h du matin. Le meilleur street food de nuit a Bayonne.",
    color: "text-brand-pink",
  },
  {
    icon: Truck,
    title: "Livraison rapide",
    description:
      "Livraison dans toute la zone Bayonne-Anglet-Biarritz. Chez vous en 30 min.",
    color: "text-brand-green",
  },
  {
    icon: MapPin,
    title: "Click & Collect",
    description:
      "Commandez en ligne et recuperez votre commande directement au restaurant.",
    color: "text-brand-purple",
  },
];

export function BrandStory() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Pourquoi South Street Food ?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Le concept street food exclusif de Bayonne, ne en 2020 avec une
            mission : du fast food de qualite, accessible a tous.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass-card p-6 text-center group hover:scale-[1.02] transition-transform duration-300"
            >
              <div
                className={`inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-muted mb-4 ${feature.color}`}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
