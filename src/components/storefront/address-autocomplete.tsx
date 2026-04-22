"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, AlertTriangle, Truck, Loader2 } from "lucide-react";
import {
  DELIVERY_ZONES,
  RESTAURANT_LOCATION,
  getDeliveryFeeForCity,
} from "@/lib/constants";

/* ───────── types ───────── */

export interface ParsedAddress {
  street: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
  formattedAddress: string;
}

interface Props {
  /** Current address value for the input */
  value: string;
  /** Called when an address is selected from autocomplete */
  onAddressSelect: (address: ParsedAddress) => void;
  /** Called when the input is cleared */
  onClear: () => void;
  /** Currently detected delivery fee (null = not deliverable) */
  deliveryFee: number | null;
}

/** Shape of a feature from the Base Adresse Nationale (api-adresse.data.gouv.fr) */
interface BANFeature {
  geometry: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  properties: {
    label: string;
    score: number;
    type: "housenumber" | "street" | "locality" | "municipality";
    name: string;
    postcode: string;
    city: string;
    housenumber?: string;
    street?: string;
    context?: string;
  };
}

interface BANResponse {
  features: BANFeature[];
}

/* ───────── helpers ───────── */

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " \u20ac";
}

/**
 * Query the Base Adresse Nationale (French government address API).
 * FREE, no API key, no credit card. Biased on restaurant location.
 *
 * Docs : https://adresse.data.gouv.fr/api-doc/adresse
 */
async function searchAddresses(query: string): Promise<BANFeature[]> {
  if (query.trim().length < 3) return [];
  const url = new URL("https://api-adresse.data.gouv.fr/search/");
  url.searchParams.set("q", query);
  url.searchParams.set("autocomplete", "1");
  url.searchParams.set("limit", "6");
  // Bias results around the restaurant (Bayonne)
  url.searchParams.set("lat", String(RESTAURANT_LOCATION.lat));
  url.searchParams.set("lon", String(RESTAURANT_LOCATION.lng));

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data: BANResponse = await res.json();
    // Prioritize housenumber + street matches (useful for delivery)
    const ranked = [...data.features].sort((a, b) => {
      const priority = (f: BANFeature) => {
        if (f.properties.type === "housenumber") return 0;
        if (f.properties.type === "street") return 1;
        return 2;
      };
      const pa = priority(a);
      const pb = priority(b);
      if (pa !== pb) return pa - pb;
      return b.properties.score - a.properties.score;
    });
    return ranked;
  } catch {
    return [];
  }
}

function parseFeature(feature: BANFeature): ParsedAddress {
  const [lng, lat] = feature.geometry.coordinates;
  const p = feature.properties;
  // "name" already holds the street + housenumber when type is housenumber
  // ex: "12 Rue de la République"
  const street =
    p.type === "housenumber" ? p.name : p.street || p.name;
  return {
    street,
    city: p.city,
    postalCode: p.postcode,
    lat,
    lng,
    formattedAddress: p.label,
  };
}

/* ───────── component ───────── */

export function AddressAutocomplete({
  value,
  onAddressSelect,
  onClear,
  deliveryFee,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<BANFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Distinguish "user is typing" (fetch) from "we just set from selection"
  // (don't re-fetch).
  const skipNextFetch = useRef(false);

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounced search as user types
  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    if (inputValue.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const results = await searchAddresses(inputValue);
      setSuggestions(results);
      setLoading(false);
      // Only open dropdown if there are real matches AND input is still focused
      if (
        results.length > 0 &&
        document.activeElement === inputRef.current
      ) {
        setOpen(true);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Click outside = close dropdown
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = useCallback(
    (feature: BANFeature) => {
      const parsed = parseFeature(feature);
      skipNextFetch.current = true;
      setInputValue(parsed.formattedAddress);
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      onAddressSelect(parsed);
    },
    [onAddressSelect]
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    onClear();
    inputRef.current?.focus();
  }, [onClear]);

  // Keyboard nav in the dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        i <= 0 ? suggestions.length - 1 : i - 1
      );
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Address input + suggestions dropdown */}
      <div className="relative">
        <label className="text-xs font-medium text-[#86868b] mb-1.5 block">
          Adresse de livraison
        </label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b] pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tapez votre adresse..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (e.target.value === "") {
                onClear();
                setOpen(false);
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className="w-full h-12 pl-10 pr-10 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-[#1d1d1f]/30 transition-all"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={open}
          />
          {loading && (
            <Loader2 className="absolute right-10 top-[calc(50%+0.3rem)] h-4 w-4 text-[#86868b] animate-spin" />
          )}
          {inputValue && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-[calc(50%+0.3rem)] -translate-y-1/2 h-5 w-5 rounded-full bg-[#c7c7cc] flex items-center justify-center cursor-pointer hover:bg-[#aeaeb2] transition-colors"
              aria-label="Effacer"
            >
              <span className="text-white text-xs font-bold leading-none">
                &times;
              </span>
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {open && suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-20 mt-1.5 w-full bg-white border border-[#e5e5ea] rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto"
          >
            {suggestions.map((s, i) => {
              const isActive = i === activeIndex;
              const feeForCity = getDeliveryFeeForCity(s.properties.city);
              return (
                <li key={s.properties.label + i}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => handleSelect(s)}
                    className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${
                      isActive ? "bg-[#f5f5f7]" : "bg-white"
                    } hover:bg-[#f5f5f7] cursor-pointer`}
                  >
                    <MapPin className="h-4 w-4 text-[#86868b] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[#1d1d1f] truncate">
                        {s.properties.name}
                      </div>
                      <div className="text-xs text-[#86868b] truncate">
                        {s.properties.postcode} {s.properties.city}
                        {s.properties.context
                          ? ` · ${s.properties.context.split(",")[0]}`
                          : ""}
                      </div>
                    </div>
                    {feeForCity !== null ? (
                      <span className="shrink-0 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded px-2 py-0.5 whitespace-nowrap">
                        {formatPrice(feeForCity)}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[11px] font-semibold text-red-700 bg-red-50 rounded px-2 py-0.5 whitespace-nowrap">
                        Hors zone
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Fee feedback (when address is locked in) */}
      {deliveryFee !== null && deliveryFee > 0 && !open && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
          <Truck className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-700">
            Livraison {formatPrice(deliveryFee)}
          </span>
        </div>
      )}

      {/* Not deliverable warning */}
      {deliveryFee === null && value !== "" && !open && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Nous ne livrons pas dans cette ville.{" "}
          <button
            type="button"
            onClick={handleClear}
            className="underline underline-offset-2 hover:no-underline"
          >
            Essayer une autre adresse
          </button>
        </div>
      )}

      {/* Subtle attribution (required by data.gouv.fr terms) */}
      <p className="text-[10px] text-[#aeaeb2]">
        Adresses fournies par{" "}
        <a
          href="https://adresse.data.gouv.fr/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[#86868b]"
        >
          Base Adresse Nationale
        </a>
      </p>
    </div>
  );
}

/**
 * Build an OpenStreetMap embed URL centered on lat/lng with a marker.
 * FREE, no API key needed. Used as alternative to Google Maps Embed.
 */
export function osmEmbedUrl(lat: number, lng: number): string {
  const dLat = 0.003;
  const dLng = 0.005;
  const bbox = `${lng - dLng},${lat - dLat},${lng + dLng},${lat + dLat}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}
