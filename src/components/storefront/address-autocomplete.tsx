"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MapPin, AlertTriangle, Truck, Loader2 } from "lucide-react";
import {
  DELIVERY_ZONES,
  RESTAURANT_LOCATION,
  getDeliveryFeeForCity,
} from "@/lib/constants";

/* ─── types ─── */

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

/* ─── helpers ─── */

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " \u20ac";
}

// Init Google Maps API once
let mapsInitialized = false;
function initMaps(): boolean {
  if (mapsInitialized) return true;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return false;
  setOptions({ key, v: "weekly" });
  mapsInitialized = true;
  return true;
}

/* ─── component ─── */

export function AddressAutocomplete({
  value,
  onAddressSelect,
  onClear,
  deliveryFee,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Load Google Maps
  useEffect(() => {
    if (!initMaps()) {
      setLoadError(true);
      return;
    }
    importLibrary("places")
      .then(() => setMapsLoaded(true))
      .catch(() => setLoadError(true));
  }, []);

  // Attach autocomplete to input
  useEffect(() => {
    if (!mapsLoaded || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "fr" },
      fields: [
        "address_components",
        "geometry",
        "formatted_address",
      ],
    });

    // Bias results towards Bayonne area
    autocomplete.setBounds(
      new google.maps.LatLngBounds(
        { lat: RESTAURANT_LOCATION.lat - 0.15, lng: RESTAURANT_LOCATION.lng - 0.2 },
        { lat: RESTAURANT_LOCATION.lat + 0.15, lng: RESTAURANT_LOCATION.lng + 0.2 }
      )
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location || !place.address_components) return;

      let street = "";
      let city = "";
      let postalCode = "";

      for (const comp of place.address_components) {
        const types = comp.types;
        if (types.includes("street_number")) {
          street = comp.long_name + " " + street;
        }
        if (types.includes("route")) {
          street = street + comp.long_name;
        }
        if (types.includes("locality")) {
          city = comp.long_name;
        }
        if (types.includes("postal_code")) {
          postalCode = comp.long_name;
        }
      }

      street = street.trim();
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const formattedAddress = place.formatted_address || `${street}, ${postalCode} ${city}`;

      setInputValue(formattedAddress);

      onAddressSelect({
        street,
        city,
        postalCode,
        lat,
        lng,
        formattedAddress,
      });
    });

    autocompleteRef.current = autocomplete;
  }, [mapsLoaded, onAddressSelect]);

  const handleClear = useCallback(() => {
    setInputValue("");
    onClear();
    inputRef.current?.focus();
  }, [onClear]);

  // If Google Maps fails to load, render a simple fallback
  if (loadError) {
    return <FallbackCitySelect onAddressSelect={onAddressSelect} onClear={onClear} />;
  }

  return (
    <div className="space-y-3">
      {/* Address input */}
      <div>
        <label className="text-xs font-medium text-[#86868b] mb-1.5 block">
          Adresse de livraison
        </label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tapez votre adresse..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (e.target.value === "") onClear();
            }}
            className="w-full h-12 pl-10 pr-10 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 focus:border-[#1d1d1f]/30 transition-all"
            autoComplete="off"
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#c7c7cc] flex items-center justify-center cursor-pointer hover:bg-[#aeaeb2] transition-colors"
              aria-label="Effacer"
            >
              <span className="text-white text-xs font-bold leading-none">&times;</span>
            </button>
          )}
        </div>
        {!mapsLoaded && !loadError && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#86868b]">
            <Loader2 className="h-3 w-3 animate-spin" />
            Chargement...
          </div>
        )}
      </div>

      {/* Fee feedback */}
      {deliveryFee !== null && deliveryFee > 0 && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
          <Truck className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-700">
            Livraison {formatPrice(deliveryFee)}
          </span>
        </div>
      )}

      {/* Not deliverable warning */}
      {deliveryFee === null && inputValue.length > 5 && value !== "" && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Nous ne livrons pas dans cette ville
        </div>
      )}
    </div>
  );
}

/* ─── Fallback: simple city dropdown (when Google Maps fails) ─── */

function FallbackCitySelect({
  onAddressSelect,
  onClear,
}: {
  onAddressSelect: (address: ParsedAddress) => void;
  onClear: () => void;
}) {
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    if (!newCity) {
      onClear();
      return;
    }
    onAddressSelect({
      street,
      city: newCity,
      postalCode,
      lat: 0,
      lng: 0,
      formattedAddress: `${street}, ${postalCode} ${newCity}`,
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-[#86868b] mb-1.5 block">Ville</label>
        <select
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
          className="w-full h-12 pl-4 pr-10 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] appearance-none focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 transition-all cursor-pointer"
        >
          <option value="">Choisir votre ville</option>
          {DELIVERY_ZONES.map((zone) => (
            <optgroup key={zone.fee} label={`${formatPrice(zone.fee)} de livraison`}>
              {zone.cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-[#86868b] mb-1.5 block">Adresse</label>
        <input
          type="text"
          placeholder="12 rue de la République"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          className="w-full h-11 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 transition-all"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-[#86868b] mb-1.5 block">Code postal</label>
        <input
          type="text"
          placeholder="64100"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          className="w-full h-11 px-4 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] text-sm text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f]/10 transition-all"
        />
      </div>
    </div>
  );
}
