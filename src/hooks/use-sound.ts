"use client";

import { useCallback, useRef, useState } from "react";

export function useSound(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(true);

  const play = useCallback(() => {
    if (!enabled) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(src);
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Autoplay blocked by browser - user needs to interact first
      });
    } catch {
      // Audio not supported
    }
  }, [src, enabled]);

  return { play, enabled, setEnabled };
}
