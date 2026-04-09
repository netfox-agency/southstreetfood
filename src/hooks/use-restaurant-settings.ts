"use client";

import { useEffect, useState } from "react";

export type RestaurantSettings = {
  baseDeliveryFee: number;
  minOrderDelivery: number;
  deliveryEnabled: boolean;
  collectEnabled: boolean;
  estimatedPrepMinutes: number;
};

const FALLBACK: RestaurantSettings = {
  baseDeliveryFee: 350,
  minOrderDelivery: 0,
  deliveryEnabled: true,
  collectEnabled: true,
  estimatedPrepMinutes: 20,
};

// Module-level cache — all mounted hooks share the same in-flight fetch and
// the same resolved snapshot, so opening cart -> checkout doesn't hit the
// endpoint twice.
let cached: RestaurantSettings | null = null;
let inFlight: Promise<RestaurantSettings> | null = null;

async function load(): Promise<RestaurantSettings> {
  if (cached) return cached;
  if (inFlight) return inFlight;
  inFlight = fetch("/api/restaurant/settings", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : FALLBACK))
    .then((data: RestaurantSettings) => {
      cached = data;
      inFlight = null;
      return data;
    })
    .catch(() => {
      inFlight = null;
      return FALLBACK;
    });
  return inFlight;
}

export function useRestaurantSettings() {
  const [settings, setSettings] = useState<RestaurantSettings>(
    cached ?? FALLBACK
  );
  const [ready, setReady] = useState(!!cached);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    load().then((s) => {
      if (cancelled) return;
      setSettings(s);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, ready };
}
