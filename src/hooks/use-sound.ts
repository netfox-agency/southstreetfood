"use client";

import { useCallback, useRef, useState, useEffect } from "react";

/**
 * Hook de notification sonore pour la cuisine.
 *
 * On utilise le Web Audio API pour generer un beep a la volee plutot qu'un
 * fichier .mp3. Avantages :
 *  - Pas de fichier statique a gerer (pas de 404 possible)
 *  - Pas de lag de chargement audio
 *  - Marche offline (PWA-ready)
 *  - Customizable (frequence, duree) si on veut un autre son plus tard
 *
 * Le son joue est un "ding-dong" 2 notes (E5 + C5, intervalle de tierce
 * mineure, agreable et reconnaissable comme une notification). 250ms total.
 *
 * IMPORTANT : Chrome/Safari bloquent l'autoplay audio avant la 1ere
 * interaction utilisateur. Le staff cuisine doit donc cliquer quelque part
 * (n'importe ou) une fois en arrivant pour debloquer l'audio. Une fois
 * fait, ca marche jusqu'a la fermeture de l'onglet.
 *
 * Le `src` parametre est garde pour API-compat avec l'ancien hook qui
 * acceptait un chemin de fichier, mais il est ignore aujourd'hui.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useSound(_src?: string) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(true);

  // Init lazy : on cree l'AudioContext seulement quand on en a besoin
  // (et seulement client-side, pas en SSR).
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Persist user preference du toggle son
    const stored = localStorage.getItem("ssf-kitchen-sound");
    if (stored === "off") setEnabled(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("ssf-kitchen-sound", enabled ? "on" : "off");
  }, [enabled]);

  const play = useCallback(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    try {
      // Lazy-init AudioContext (peut etre suspended si l'user n'a pas
      // encore interagi avec la page — on le resume)
      if (!audioCtxRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctx) return;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      // 2 notes : E5 (659Hz) puis C5 (523Hz). Tierce mineure descendante.
      // Sonne comme un "ding-dong" sympa de notification.
      const now = ctx.currentTime;
      playNote(ctx, 659.25, now, 0.15);
      playNote(ctx, 523.25, now + 0.12, 0.18);
    } catch {
      // AudioContext indisponible / refuse — fail silent
    }
  }, [enabled]);

  return { play, enabled, setEnabled };
}

/**
 * Joue une note sinusoidale a la frequence + duree donnees.
 * Enveloppe ADSR simple : attack rapide, release expo pour eviter le click.
 */
function playNote(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = frequency;

  // Volume : 0.25 (pas trop fort pour ne pas saturer en cuisine)
  // Attack 10ms, release expo sur la duree
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.25, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}
