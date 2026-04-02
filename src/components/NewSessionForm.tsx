"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StationSearch } from "@/components/StationSearch";

export function NewSessionForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!lat || !lng) {
      setError("Pick a venue from location search");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          date: new Date(date).toISOString(),
          rsvpDeadline: new Date(deadline).toISOString(),
          locationName,
          locationLat: lat,
          locationLng: lng,
        }),
      });
      const data = (await res.json()) as { error?: string; session?: { id: string } };
      if (!res.ok) {
        setError(data.error ?? "Failed");
        return;
      }
      if (data.session) router.push(`/sessions/${data.session.id}`);
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4">
      {error && (
        <p className="rounded-lg bg-[#8b1a1a]/30 px-3 py-2 text-sm text-red-200">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm text-[#a0a0a0]">Session name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-white"
          placeholder="Weekly training"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[#a0a0a0]">Date & time (session start)</label>
        <input
          required
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-white"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[#a0a0a0]">RSVP deadline</label>
        <input
          required
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-white"
        />
      </div>
      <StationSearch
        label="Venue location"
        mode="address"
        initialName={locationName}
        onPlace={(p) => {
          setLocationName(p.name);
          setLat(p.lat);
          setLng(p.lng);
        }}
      />
      <button
        type="submit"
        disabled={loading}
        className="tap-target w-full rounded-lg bg-[#8b1a1a] py-3 font-medium text-white hover:bg-[#a32222] disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create session"}
      </button>
    </form>
  );
}
