/**
 * Calcule le statut ouvert/ferme du restaurant a un instant donne.
 *
 * Combine 2 sources :
 *   1. manual_status + temp_closed_until (override staff)
 *   2. opening_hours (planning par jour de semaine en heure Paris)
 *
 * Le service SSF traverse minuit (Lun-Sam 19:00 → 04:00 du lendemain).
 * La logique tient compte de ca :
 *   - Mardi 02:00 Paris → "on est dans le service du Lundi qui se prolonge"
 *     donc on regarde les opening_hours du LUNDI (close=04:00 = 04:00 Mardi)
 *     et c'est encore ouvert si 02:00 < 04:00.
 */

export type ManualStatus =
  | "auto"
  | "open"
  | "closed"
  | "temporarily_closed";

export type OpeningHours = Record<
  string, // "monday", "tuesday", ... "sunday"
  { open: string; close: string }
>;

export type RestaurantSettings = {
  manual_status: ManualStatus;
  temp_closed_until: string | null;
  opening_hours: OpeningHours | null;
};

export type RestaurantStatus = {
  /** True si on peut commander maintenant */
  isOpen: boolean;
  /**
   * Raison du statut : "manual_open" | "manual_closed" | "temporarily_closed" |
   * "scheduled_open" | "scheduled_closed"
   */
  reason:
    | "manual_open"
    | "manual_closed"
    | "temporarily_closed"
    | "scheduled_open"
    | "scheduled_closed";
  /**
   * Date ISO a laquelle le resto reouvre (seulement si isOpen=false). Null
   * si manual_status='closed' (pas de reouverture programmee).
   */
  reopensAt: string | null;
  /** Message formate prêt a afficher cote client */
  message: string;
};

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

/**
 * Renvoie les composants "a l'instant t" dans le fuseau Paris :
 * { weekday (0..6 dim=0), hour (0..23), minute (0..59) }.
 */
function parisParts(now: Date): {
  weekday: number;
  hour: number;
  minute: number;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekdayLabel = get("weekday").toLowerCase();
  const map: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };
  return {
    weekday: map[weekdayLabel] ?? 0,
    hour: parseInt(get("hour"), 10) || 0,
    minute: parseInt(get("minute"), 10) || 0,
  };
}

/** Parse "HH:MM" en minutes depuis minuit. */
function hhmmToMinutes(s: string): number {
  const [h, m] = s.split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

/** Retourne l'ISO timestamp du prochain "HH:MM Paris" strictement dans le futur. */
function nextParisTimeISO(hhmm: string, now: Date): string {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const year = parseInt(get("year"), 10);
  const month = parseInt(get("month"), 10);
  const day = parseInt(get("day"), 10);
  const curHour = parseInt(get("hour"), 10);
  const curMin = parseInt(get("minute"), 10);

  const target = new Date(
    Date.UTC(year, month - 1, day, h || 0, m || 0, 0),
  );
  // Align sur Paris offset
  const parisOffsetMin = getParisOffsetMinutes(target);
  target.setUTCMinutes(target.getUTCMinutes() - parisOffsetMin);

  const nowMin = curHour * 60 + curMin;
  const targetMin = (h || 0) * 60 + (m || 0);
  if (nowMin >= targetMin) {
    target.setUTCDate(target.getUTCDate() + 1);
  }
  return target.toISOString();
}

function getParisOffsetMinutes(date: Date): number {
  const utcString = date.toLocaleString("en-US", { timeZone: "UTC" });
  const parisString = date.toLocaleString("en-US", { timeZone: "Europe/Paris" });
  const utcMs = new Date(utcString).getTime();
  const parisMs = new Date(parisString).getTime();
  return Math.round((parisMs - utcMs) / 60_000);
}

/**
 * Format un ISO timestamp en "HH:MM" heure Paris (ex: "19:00").
 * Pour afficher cote client.
 */
export function formatParisTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Check si l'instant "now" est dans la plage d'ouverture
 * d'un jour de la semaine donne, en tenant compte du fait que close
 * peut etre < open (service qui traverse minuit).
 *
 * Retourne : { inRange: bool, opensAt?: HH:MM si hors-plage pour le day+1 }
 */
function isInOpeningRange(
  openHHMM: string,
  closeHHMM: string,
  nowMinutes: number,
  isYesterdaysRange: boolean, // true si on check la plage de HIER (Lundi soir jusqu'a 4h Mardi)
): boolean {
  const o = hhmmToMinutes(openHHMM);
  const c = hhmmToMinutes(closeHHMM);

  if (c > o) {
    // Plage normale intra-jour : ex open=11:00 close=14:00
    if (isYesterdaysRange) return false;
    return nowMinutes >= o && nowMinutes < c;
  }
  if (c === o) {
    // Ferme
    return false;
  }
  // c < o : service qui traverse minuit
  if (isYesterdaysRange) {
    // On check la fin du service d'hier (00h → close aujourd'hui)
    return nowMinutes < c;
  }
  // Le service d'aujourd'hui : open → minuit
  return nowMinutes >= o;
}

/**
 * Logique principale : calcule le statut ouvert/ferme.
 */
export function computeCurrentStatus(
  settings: RestaurantSettings,
  now: Date = new Date(),
): RestaurantStatus {
  const { manual_status, temp_closed_until, opening_hours } = settings;

  // 1. Override manuel : open
  if (manual_status === "open") {
    return {
      isOpen: true,
      reason: "manual_open",
      reopensAt: null,
      message: "Ouvert",
    };
  }

  // 2. Override manuel : closed
  if (manual_status === "closed") {
    return {
      isOpen: false,
      reason: "manual_closed",
      reopensAt: null,
      message: "Fermé",
    };
  }

  // 3. Temp closed : expire dans le temps
  if (manual_status === "temporarily_closed" && temp_closed_until) {
    const until = new Date(temp_closed_until);
    if (until.getTime() > now.getTime()) {
      return {
        isOpen: false,
        reason: "temporarily_closed",
        reopensAt: until.toISOString(),
        message: `Fermé temporairement, retour à ${formatParisTime(
          until.toISOString(),
        )}`,
      };
    }
    // Expire, on tombe en auto (le cron le reset aussi en DB)
  }

  // 4. Auto : check opening hours
  const hours = opening_hours || {};
  const { weekday, hour, minute } = parisParts(now);
  const nowMin = hour * 60 + minute;

  // Jour courant
  const todayKey = DAY_KEYS[weekday];
  const todayRange = hours[todayKey];
  const yesterdayIdx = (weekday - 1 + 7) % 7;
  const yesterdayKey = DAY_KEYS[yesterdayIdx];
  const yesterdayRange = hours[yesterdayKey];

  // On est ouvert si :
  //   - on est dans la plage du jour courant (open→close ou open→minuit si cross)
  //   - OU on est dans la fin du service de la veille (si elle traversait minuit)
  const inTodayRange = todayRange
    ? isInOpeningRange(todayRange.open, todayRange.close, nowMin, false)
    : false;
  const inYesterdayTail = yesterdayRange
    ? isInOpeningRange(yesterdayRange.open, yesterdayRange.close, nowMin, true)
    : false;

  if (inTodayRange || inYesterdayTail) {
    return {
      isOpen: true,
      reason: "scheduled_open",
      reopensAt: null,
      message: "Ouvert",
    };
  }

  // Fermé : compute l'heure de reouverture (prochain open d'un jour)
  // Cherche dans les 7 prochains jours, le premier open futur.
  let reopensAt: string | null = null;
  for (let i = 0; i < 7; i++) {
    const d = DAY_KEYS[(weekday + i) % 7];
    const range = hours[d];
    if (!range) continue;
    if (i === 0) {
      // Aujourd'hui : si on est AVANT open, reouvre aujourd'hui
      if (nowMin < hhmmToMinutes(range.open)) {
        reopensAt = nextParisTimeISO(range.open, now);
        break;
      }
    } else {
      // Jour futur : prochain open a range.open
      const future = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      reopensAt = nextParisTimeISO(range.open, future);
      break;
    }
  }

  return {
    isOpen: false,
    reason: "scheduled_closed",
    reopensAt,
    message: reopensAt
      ? `Fermé, réouverture à ${formatParisTime(reopensAt)}`
      : "Fermé",
  };
}
