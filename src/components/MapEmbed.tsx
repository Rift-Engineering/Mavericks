"use client";

import { createGoogleMapsLoader } from "@/lib/google-maps-loader";
import { useEffect, useRef, useState } from "react";

export function MapEmbed({
  lat,
  lng,
  title,
}: {
  lat: number;
  lng: number;
  title?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  useEffect(() => {
    if (!apiKey || !ref.current) return;
    let cancelled = false;
    const loader = createGoogleMapsLoader(apiKey);
    void loader.load().then(() => {
      if (cancelled || !ref.current || !window.google?.maps) return;
      const map = new window.google.maps.Map(ref.current, {
        center: { lat, lng },
        zoom: 15,
        disableDefaultUI: true,
      });
      new window.google.maps.Marker({
        position: { lat, lng },
        map,
        title: title ?? "Venue",
      });
    }).catch(() => setError("Map could not be loaded"));
    return () => {
      cancelled = true;
    };
  }, [lat, lng, title, apiKey]);

  if (!apiKey) {
    return (
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
        target="_blank"
        rel="noreferrer"
        className="block rounded-lg border border-white/10 bg-white/[0.03] p-4 text-center text-sm text-[#8b1a1a] hover:underline"
      >
        Open in Google Maps
      </a>
    );
  }

  if (error) {
    return (
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
        target="_blank"
        rel="noreferrer"
        className="block rounded-lg border border-white/10 p-4 text-center text-sm text-[#a0a0a0]"
      >
        {error} — open in Google Maps
      </a>
    );
  }

  return <div ref={ref} className="h-48 w-full rounded-lg border border-white/10 md:h-64" />;
}
