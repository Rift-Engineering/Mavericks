"use client";

import { createGoogleMapsLoader } from "@/lib/google-maps-loader";
import { useEffect, useId, useRef, useState } from "react";

type Props = {
  label: string;
  mode: "station" | "address";
  initialName?: string;
  onPlace: (data: { name: string; lat: number; lng: number }) => void;
  disabled?: boolean;
};

export function StationSearch({ label, mode, initialName, onPlace, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onPlaceRef = useRef(onPlace);
  const id = useId();
  const [ready, setReady] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  useEffect(() => {
    onPlaceRef.current = onPlace;
  }, [onPlace]);

  useEffect(() => {
    if (!apiKey || !inputRef.current) return;
    const loader = createGoogleMapsLoader(apiKey);
    let ac: google.maps.places.Autocomplete | undefined;
    let listener: google.maps.MapsEventListener | undefined;
    void loader.load().then(() => {
      if (!inputRef.current) return;
      ac = new google.maps.places.Autocomplete(inputRef.current, {
        types: mode === "station" ? ["train_station"] : ["geocode"],
        componentRestrictions: { country: "jp" },
        fields: ["geometry", "name", "formatted_address"],
      });
      listener = ac.addListener("place_changed", () => {
        const place = ac!.getPlace();
        const loc = place.geometry?.location;
        if (!loc) return;
        const name =
          place.name ?? place.formatted_address ?? inputRef.current?.value ?? "";
        onPlaceRef.current({
          name,
          lat: loc.lat(),
          lng: loc.lng(),
        });
      });
      setReady(true);
    });
    return () => {
      listener?.remove();
    };
  }, [apiKey, mode]);

  if (!apiKey) {
    return (
      <div>
        <label htmlFor={id} className="mb-1 block text-sm text-[#a0a0a0]">
          {label}
        </label>
        <p className="text-xs text-amber-200/90">
          Add NEXT_PUBLIC_GOOGLE_MAPS_KEY for autocomplete.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-[#a0a0a0]">
        {label}
        {!ready && <span className="ml-2 text-xs text-[#a0a0a0]">Loading…</span>}
      </label>
      <input
        id={id}
        ref={inputRef}
        key={initialName ?? "empty"}
        defaultValue={initialName ?? ""}
        disabled={disabled || !ready}
        autoComplete="off"
        className="w-full rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-white"
        placeholder={mode === "station" ? "Search train station" : "Search address or place"}
      />
    </div>
  );
}
