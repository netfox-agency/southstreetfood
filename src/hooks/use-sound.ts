"use client";

import { useCallback, useRef, useState, useEffect } from "react";

/**
 * Hook de notification sonore pour la cuisine.
 *
 * Web Audio API : on genere les sons a la volee (pas de fichier .mp3 → pas
 * de 404, marche offline, pas de lag).
 *
 * Deux usages :
 *  - `play()` : un "ding-dong" 2 notes ponctuel (bouton test du son).
 *  - `startAlertLoop()` / `stopAlertLoop()` : un chime URGENT qui BOUCLE en
 *    continu (toutes les 1.4s) jusqu'a ce qu'on l'arrete. C'est ce qui sonne
 *    quand une nouvelle commande arrive — facon Uber Eats : ca ne s'arrete
 *    pas tant que le cuisto n'a pas tape "Accepter".
 *
 * AUTOPLAY : Chrome/Safari bloquent l'audio avant la 1ere interaction. Le
 * staff doit taper une fois (le gate "Demarrer le service"). `unlock()`
 * resume l'AudioContext sur ce geste et passe `unlocked` a true. Tant que
 * `unlocked` est false, aucun son ne sortira meme si on appelle play().
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useSound(_src?: string) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("ssf-kitchen-sound");
    if (stored === "off") setEnabled(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("ssf-kitchen-sound", enabled ? "on" : "off");
  }, [enabled]);

  // Cree (lazy) l'AudioContext. Retourne null si indispo.
  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }, []);

  /**
   * Debloque l'audio sur un geste utilisateur. A appeler depuis le onClick
   * du gate "Demarrer le service". Joue un mini-bip pour confirmer.
   */
  const unlock = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    // Mini bip de confirmation (et ca "reveille" vraiment le ctx sur iOS)
    try {
      playNote(ctx, 880, ctx.currentTime, 0.08, 0.2);
    } catch {
      /* ignore */
    }
    setUnlocked(true);
  }, [getCtx]);

  /** Ding-dong ponctuel (bouton test). */
  const play = useCallback(() => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      playNote(ctx, 659.25, now, 0.15, 0.25);
      playNote(ctx, 523.25, now + 0.12, 0.18, 0.25);
    } catch {
      /* fail silent */
    }
  }, [enabled, getCtx]);

  /** Chime urgent (triple bip montant, fort) — un cycle. */
  const playAlertCycle = useCallback(() => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Triple bip montant, volume 0.4 (bien plus fort que le ding normal)
      playNote(ctx, 784, now, 0.13, 0.4); // G5
      playNote(ctx, 988, now + 0.15, 0.13, 0.4); // B5
      playNote(ctx, 1175, now + 0.3, 0.22, 0.4); // D6
    } catch {
      /* fail silent */
    }
  }, [enabled, getCtx]);

  /** Demarre la boucle d'alerte (idempotent). */
  const startAlertLoop = useCallback(() => {
    if (loopRef.current) return; // deja en cours
    playAlertCycle(); // immediat
    loopRef.current = setInterval(playAlertCycle, 1400);
  }, [playAlertCycle]);

  /** Arrete la boucle d'alerte. */
  const stopAlertLoop = useCallback(() => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
  }, []);

  // Cleanup au demontage
  useEffect(() => {
    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, []);

  return {
    play,
    enabled,
    setEnabled,
    unlocked,
    unlock,
    startAlertLoop,
    stopAlertLoop,
  };
}

/**
 * Joue une note sinusoidale. `volume` par defaut 0.25.
 * Enveloppe ADSR simple : attack rapide, release expo (pas de click).
 */
function playNote(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume = 0.25,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = frequency;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}
