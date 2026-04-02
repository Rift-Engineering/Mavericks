"use client";

import { createGoogleMapsLoader } from "@/lib/google-maps-loader";
import { useEffect, useRef, useState } from "react";

const GROUP_COLORS = [
  "#c9a227",
  "#2d8a6e",
  "#5b8fd9",
  "#c45c7a",
  "#9b6bff",
  "#ea580c",
  "#0891b2",
  "#65a30d",
  "#db2777",
  "#94a3b8",
];

export type CarpoolMapGroup = {
  id: string;
  driverName: string;
  pickupLabel: string;
  driverLat: number;
  driverLng: number;
  riders: { name: string; lat: number; lng: number }[];
};

export function CarpoolSessionMap({
  venueName,
  venueLat,
  venueLng,
  groups,
}: {
  venueName: string;
  venueLat: number;
  venueLng: number;
  groups: CarpoolMapGroup[];
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
      const maps = window.google.maps;
      const map = new maps.Map(ref.current, {
        center: { lat: venueLat, lng: venueLng },
        zoom: 12,
        disableDefaultUI: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      const bounds = new maps.LatLngBounds();
      const infoWindow = new maps.InfoWindow({ disableAutoPan: true });

      const closeInfo = () => {
        infoWindow.close();
      };

      map.addListener("click", closeInfo);

      const venueMarker = new maps.Marker({
        position: { lat: venueLat, lng: venueLng },
        map,
        title: venueName,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: "#fbbf24",
          fillOpacity: 1,
          strokeColor: "#1a1a1a",
          strokeWeight: 2,
        },
        zIndex: 1000,
      });
      bounds.extend({ lat: venueLat, lng: venueLng });

      venueMarker.addListener("mouseover", () => {
        infoWindow.setContent(
          `<div style="padding:4px 8px;max-width:220px;color:#111;font-size:13px;line-height:1.4">
            <strong style="color:#92400e">Venue</strong><br/>
            ${escapeHtml(venueName)}
          </div>`,
        );
        infoWindow.open({ map, anchor: venueMarker });
      });
      venueMarker.addListener("mouseout", closeInfo);
      venueMarker.addListener("click", () => {
        infoWindow.setContent(
          `<div style="padding:4px 8px;max-width:220px;color:#111;font-size:13px;line-height:1.4">
            <strong style="color:#92400e">Venue</strong><br/>
            ${escapeHtml(venueName)}
          </div>`,
        );
        infoWindow.open({ map, anchor: venueMarker });
      });

      groups.forEach((g, gi) => {
        const color = GROUP_COLORS[gi % GROUP_COLORS.length];

        const driverMarker = new maps.Marker({
          position: { lat: g.driverLat, lng: g.driverLng },
          map,
          title: `${g.driverName} — driver`,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
          zIndex: 500,
        });
        bounds.extend({ lat: g.driverLat, lng: g.driverLng });

        const driverHtml = `<div style="padding:4px 8px;max-width:240px;color:#111;font-size:13px;line-height:1.4">
          <strong style="color:${color}">Driver</strong> · Group ${gi + 1}<br/>
          <strong>${escapeHtml(g.driverName)}</strong><br/>
          <span style="opacity:.85">${escapeHtml(g.pickupLabel)}</span><br/>
          <span style="opacity:.75;font-size:12px">Venue: ${escapeHtml(venueName)}</span>
        </div>`;

        driverMarker.addListener("mouseover", () => {
          infoWindow.setContent(driverHtml);
          infoWindow.open({ map, anchor: driverMarker });
        });
        driverMarker.addListener("mouseout", closeInfo);
        driverMarker.addListener("click", () => {
          infoWindow.setContent(driverHtml);
          infoWindow.open({ map, anchor: driverMarker });
        });

        g.riders.forEach((r) => {
          const riderMarker = new maps.Marker({
            position: { lat: r.lat, lng: r.lng },
            map,
            title: `${r.name} — rider`,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: color,
              fillOpacity: 0.85,
              strokeColor: "#ffffff",
              strokeWeight: 1.5,
            },
            zIndex: 400,
          });
          bounds.extend({ lat: r.lat, lng: r.lng });

          const riderHtml = `<div style="padding:4px 8px;max-width:240px;color:#111;font-size:13px;line-height:1.4">
            <strong style="color:${color}">Rider</strong> · Group ${gi + 1}<br/>
            <strong>${escapeHtml(r.name)}</strong><br/>
            Driver: ${escapeHtml(g.driverName)}<br/>
            <span style="opacity:.75;font-size:12px">Venue: ${escapeHtml(venueName)}</span>
          </div>`;

          riderMarker.addListener("mouseover", () => {
            infoWindow.setContent(riderHtml);
            infoWindow.open({ map, anchor: riderMarker });
          });
          riderMarker.addListener("mouseout", closeInfo);
          riderMarker.addListener("click", () => {
            infoWindow.setContent(riderHtml);
            infoWindow.open({ map, anchor: riderMarker });
          });
        });
      });

      map.fitBounds(bounds, 56);
      maps.event.addListenerOnce(map, "idle", () => {
        const z = map.getZoom();
        if (z != null && z > 14) map.setZoom(14);
      });
    }).catch(() => setError("Map could not be loaded"));

    return () => {
      cancelled = true;
    };
  }, [apiKey, venueLat, venueLng, venueName, groups]);

  if (!apiKey) {
    return (
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${venueLat},${venueLng}`}
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
        href={`https://www.google.com/maps/search/?api=1&query=${venueLat},${venueLng}`}
        target="_blank"
        rel="noreferrer"
        className="block rounded-lg border border-white/10 p-4 text-center text-sm text-[#a0a0a0]"
      >
        {error} — open in Google Maps
      </a>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[#a0a0a0]">
        Hover or tap markers for group and venue. Same colour = same carpool group; gold = venue.
      </p>
      <div ref={ref} className="h-64 w-full rounded-lg border border-white/10 md:h-80" />
    </div>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
