"use client";

import { useEffect, useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type EmergencyModeState = {
  active: boolean;
  message: string | null;
  activatedAt: string | null;
  autoDisableAt: string | null;
};

const DEFAULT_STATE: EmergencyModeState = {
  active: false,
  message: null,
  activatedAt: null,
  autoDisableAt: null,
};

/**
 * Hook qui retourne l'etat du mode urgence (kill-switch commande en ligne).
 *
 * - Realtime via channel restaurant_settings UPDATE
 * - Fallback polling 30s (au cas ou realtime drop sur reseau pourri)
 * - Re-fetch sur visibility change (onglet refocus)
 *
 * Default = inactive pendant le loading initial. Comme ca un blip reseau
 * ne fait pas clignoter un faux banner d'urgence chez les clients.
 */
export function useEmergencyMode(): {
  state: EmergencyModeState;
  loading: boolean;
} {
  const [state, setState] = useState<EmergencyModeState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const instanceId = useId();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const fetchState = async () => {
      const { data } = await supabase
        .from("restaurant_settings")
        .select(
          "emergency_mode_active, emergency_mode_message, emergency_mode_activated_at, emergency_mode_auto_disable_at",
        )
        .eq("id", 1)
        .single();
      if (cancelled) return;
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = data as any;
        setState({
          active: !!d.emergency_mode_active,
          message: d.emergency_mode_message ?? null,
          activatedAt: d.emergency_mode_activated_at ?? null,
          autoDisableAt: d.emergency_mode_auto_disable_at ?? null,
        });
      }
      setLoading(false);
    };

    fetchState();

    // Realtime branch
    const channel = supabase
      .channel(`emergency-mode-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "restaurant_settings" },
        () => fetchState(),
      )
      .subscribe();

    // Polling fallback - 30s
    const interval = setInterval(fetchState, 30_000);

    // Refocus refetch
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchState();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [instanceId]);

  return { state, loading };
}
