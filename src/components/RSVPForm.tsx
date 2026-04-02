"use client";

import type { RSVP, Session } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StationSearch } from "@/components/StationSearch";
import { isRsvpOpen } from "@/lib/session-utils";

type Props = {
  session: Session;
  existing: RSVP | null;
};

export function RSVPForm({ session, existing }: Props) {
  const router = useRouter();
  const open = isRsvpOpen(session);
  const [attending, setAttending] = useState(existing?.attending ?? true);
  const [carpoolMode, setCarpoolMode] = useState<"rider" | "driver" | "own">(() => {
    if (!existing?.attending) return "rider";
    if (existing.isDriver) return "driver";
    if (existing.needsCarpool) return "rider";
    return "own";
  });
  const [transportMode, setTransportMode] = useState<string>(
    existing?.transportMode ?? "PUBLIC_TRANSPORT",
  );
  const [seats, setSeats] = useState(existing?.availableSeats ?? 2);
  const [pickup, setPickup] = useState({
    name: existing?.pickupStation ?? "",
    lat: existing?.pickupLat ?? undefined as number | undefined,
    lng: existing?.pickupLng ?? undefined as number | undefined,
  });
  const [start, setStart] = useState({
    name: existing?.startLocation ?? "",
    lat: existing?.startLat ?? undefined as number | undefined,
    lng: existing?.startLng ?? undefined as number | undefined,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!open) return;
    setError(null);
    setLoading(true);
    try {
      const body: Record<string, unknown> = { attending };
      if (attending) {
        body.carpoolMode = carpoolMode;
        if (carpoolMode === "driver") {
          body.pickupStation = pickup.name;
          body.pickupLat = pickup.lat;
          body.pickupLng = pickup.lng;
          body.availableSeats = seats;
          body.startLocation = start.name;
          body.startLat = start.lat;
          body.startLng = start.lng;
          if (!pickup.lat || !pickup.lng) {
            setError("Choose a pickup station from suggestions");
            setLoading(false);
            return;
          }
          if (!start.lat || !start.lng) {
            setError("Choose where you’re driving from (start location)");
            setLoading(false);
            return;
          }
        }
        if (carpoolMode === "rider") {
          body.startLocation = start.name;
          body.startLat = start.lat;
          body.startLng = start.lng;
          if (!start.lat || !start.lng) {
            setError("Choose your start location from suggestions");
            setLoading(false);
            return;
          }
        }
        if (carpoolMode === "own") {
          body.transportMode = transportMode;
          body.startLocation = start.name;
          body.startLat = start.lat;
          body.startLng = start.lng;
          if (!start.lat || !start.lng) {
            setError("Choose your start location from suggestions");
            setLoading(false);
            return;
          }
        }
      }

      const res = await fetch(`/api/sessions/${session.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      const summary = !attending
        ? "Marked as not attending"
        : carpoolMode === "driver"
          ? `Driving from ${start.name || "your location"}`
          : carpoolMode === "rider"
            ? "Needs a ride — you're in!"
            : `Own way (${transportMode.toLowerCase().replace("_", " ")})`;
      setSuccess(summary);
      router.refresh();
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-[#a0a0a0]">
        RSVP is closed (deadline passed or session locked).
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-lg font-medium text-white">Your RSVP</h3>
      {error && (
        <p className="rounded-lg bg-[#8b1a1a]/30 px-3 py-2 text-sm text-red-200" role="alert">{error}</p>
      )}
      {success && (
        <p className="rounded-lg bg-emerald-900/30 px-3 py-2 text-sm text-emerald-200" role="status">
          ✓ {success}
        </p>
      )}

      <div className="flex gap-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="attending"
            checked={attending}
            onChange={() => setAttending(true)}
            className="h-5 w-5 accent-[#8b1a1a]"
          />
          <span className="text-white">Attending</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="attending"
            checked={!attending}
            onChange={() => setAttending(false)}
            className="h-5 w-5 accent-[#8b1a1a]"
          />
          <span className="text-white">Not attending</span>
        </label>
      </div>

      {attending && (
        <>
          <p className="text-sm text-[#a0a0a0]">Carpool</p>
          <div className="flex flex-col gap-2">
            {(
              [
                ["rider", "I need a ride"],
                ["driver", "I'm driving (can give rides)"],
                ["own", "Making my own way"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="carpool"
                  checked={carpoolMode === value}
                  onChange={() => setCarpoolMode(value)}
                  className="h-5 w-5 accent-[#8b1a1a]"
                />
                <span className="text-white">{label}</span>
              </label>
            ))}
          </div>

          {carpoolMode === "driver" && (
            <>
              <StationSearch
                label="Driving from (home / start)"
                mode="address"
                initialName={start.name}
                onPlace={(p) => setStart({ name: p.name, lat: p.lat, lng: p.lng })}
              />
              <StationSearch
                label="Pickup station (where riders meet you)"
                mode="station"
                initialName={pickup.name}
                onPlace={(p) => setPickup({ name: p.name, lat: p.lat, lng: p.lng })}
              />
              <div>
                <label className="mb-1 block text-sm text-[#a0a0a0]">Available seats</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-white"
                />
              </div>
            </>
          )}

          {carpoolMode === "rider" && (
            <StationSearch
              label="Your start location"
              mode="address"
              initialName={start.name}
              onPlace={(p) => setStart({ name: p.name, lat: p.lat, lng: p.lng })}
            />
          )}

          {carpoolMode === "own" && (
            <>
              <div>
                <label className="mb-1 block text-sm text-[#a0a0a0]">Transport mode</label>
                <select
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-white"
                >
                  <option value="DRIVING">Driving</option>
                  <option value="PUBLIC_TRANSPORT">Public transport</option>
                  <option value="WALKING">Walking</option>
                </select>
              </div>
              <StationSearch
                label="Start location"
                mode="address"
                initialName={start.name}
                onPlace={(p) => setStart({ name: p.name, lat: p.lat, lng: p.lng })}
              />
            </>
          )}
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="tap-target w-full rounded-lg bg-[#8b1a1a] py-3 font-medium text-white hover:bg-[#a32222] disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save RSVP"}
      </button>
    </form>
  );
}
