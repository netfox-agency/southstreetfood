"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  computeCurrentStatus,
  type RestaurantSettings,
  type RestaurantStatus,
} from "@/lib/queries/restaurant-status";

/**
 * Hook qui retourne le statut ouvert/fermé actuel du resto, mis a jour
 * automatiquement via Realtime (quand l'admin change le statut, tous
 * les clients voient le changement sans refresh).
 *
 * Computed cote client depuis les settings raw + Date.now(), donc la
 * transition automatique 18:59 → 19:00 (ouverture) est instantanee sans
 * round-trip serveur.
 */
export function useRestaurantStatus(): {
  status: RestaurantStatus | null;
  loading: boolean;
} {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());

  // Poll l'heure chaque minute pour que l'ouverture a 19:00 se propage
  // automatiquement cote UI.
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial + subscribe realtime
  useEffect(() => {
    const supabase = createClient();

    const fetchSettings = async () => {
      const { data } = await supabase
        .from("restaurant_settings")
        .select("manual_status, temp_closed_until, opening_hours")
        .eq("id", 1)
        .single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (data) setSettings(data as any);
      setLoading(false);
    };

    fetchSettings();

    const channel = supabase
      .channel("restaurant-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "restaurant_settings" },
        () => {
          // Re-fetch sur change (plus safe que prendre payload.new qui
          // peut ne pas avoir tous les champs selon la config Realtime)
          fetchSettings();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const status = settings ? computeCurrentStatus(settings, now) : null;
  return { status, loading };
}
