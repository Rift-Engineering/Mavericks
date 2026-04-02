"use client";

import type { RSVP, TransportMode, User } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";
import { StationSearch } from "@/components/StationSearch";

type SessionOption = { id: string; name: string; date: string };
type UserRow = Pick<User, "id" | "name" | "email">;

type RsvpRow = RSVP & { user: Pick<User, "id" | "name" | "email"> };

function statusLabel(r: RSVP | null): string {
  if (!r) return "No RSVP";
  if (!r.attending) return "Not attending";
  if (r.isDriver) return "Driving";
  if (r.needsCarpool) return "Needs ride";
  return "Own way";
}

export function AdminAttendancePanel({
  sessions,
  users,
  canEdit = true,
}: {
  sessions: SessionOption[];
  users: UserRow[];
  /** When false, list is view-only (admin PATCH is still enforced server-side). */
  canEdit?: boolean;
}) {
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? "");
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRsvps = useCallback(async () => {
    if (!sessionId) return;
    setLoadingList(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/rsvps`);
      const data = (await res.json()) as { rsvps?: RsvpRow[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to load RSVPs");
        return;
      }
      setRsvps(data.rsvps ?? []);
    } catch {
      setError("Failed to load RSVPs");
    } finally {
      setLoadingList(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void loadRsvps();
  }, [loadRsvps]);

  const rsvpByUserId = new Map(rsvps.map((r) => [r.userId, r]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-sm text-[#a0a0a0]">Session</label>
          <select
            value={sessionId}
            onChange={(e) => {
              setSessionId(e.target.value);
              setEditingUserId(null);
            }}
            className="w-full max-w-xl rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-white"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} —{" "}
                {new Date(s.date).toLocaleString("en-GB", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Tokyo",
                })}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => void loadRsvps()}
          disabled={loadingList || !sessionId}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5 disabled:opacity-50"
        >
          {loadingList ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-[#8b1a1a]/30 px-3 py-2 text-sm text-red-200">{error}</p>
      )}

      {sessions.length === 0 && (
        <p className="text-[#a0a0a0]">No sessions yet. Create one under New session.</p>
      )}

      {sessionId && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-[#a0a0a0]">
              <tr>
                <th className="px-3 py-2 font-medium">Player</th>
                <th className="px-3 py-2 font-medium">Status</th>
                {canEdit && <th className="w-32 px-3 py-2 font-medium"> </th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const r = rsvpByUserId.get(u.id) ?? null;
                const open = editingUserId === u.id;
                return (
                  <tr key={u.id} className="border-b border-white/5 align-top">
                    <td className="px-3 py-3 text-white">
                      <span className="font-medium">{u.name}</span>
                      <span className="mt-0.5 block text-xs text-[#a0a0a0]">{u.email}</span>
                    </td>
                    <td className="px-3 py-3 text-[#a0a0a0]">{statusLabel(r)}</td>
                    {canEdit && (
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setEditingUserId(open ? null : u.id)}
                          className="text-[#8b1a1a] hover:underline"
                        >
                          {open ? "Close" : "Edit"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && editingUserId && sessionId && (
        <AdminRsvpEditor
          sessionId={sessionId}
          user={users.find((x) => x.id === editingUserId)!}
          existing={rsvpByUserId.get(editingUserId) ?? null}
          onClose={() => setEditingUserId(null)}
          onSaved={() => {
            void loadRsvps();
          }}
        />
      )}
    </div>
  );
}

function AdminRsvpEditor({
  sessionId,
  user,
  existing,
  onClose,
  onSaved,
}: {
  sessionId: string;
  user: UserRow;
  existing: RsvpRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [attending, setAttending] = useState(existing?.attending ?? false);
  const [carpoolMode, setCarpoolMode] = useState<"rider" | "driver" | "own">(() => {
    if (!existing?.attending) return "rider";
    if (existing.isDriver) return "driver";
    if (existing.needsCarpool) return "rider";
    return "own";
  });
  const [transportMode, setTransportMode] = useState<TransportMode>(
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
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
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
            setFormError("Choose a pickup station from suggestions");
            setSaving(false);
            return;
          }
          if (!start.lat || !start.lng) {
            setFormError("Choose where they drive from (start location)");
            setSaving(false);
            return;
          }
        }
        if (carpoolMode === "rider") {
          body.startLocation = start.name;
          body.startLat = start.lat;
          body.startLng = start.lng;
          if (!start.lat || !start.lng) {
            setFormError("Choose a start location from suggestions");
            setSaving(false);
            return;
          }
        }
        if (carpoolMode === "own") {
          body.transportMode = transportMode;
          body.startLocation = start.name;
          body.startLat = start.lat;
          body.startLng = start.lng;
          if (!start.lat || !start.lng) {
            setFormError("Choose a start location from suggestions");
            setSaving(false);
            return;
          }
        }
      }

      const res = await fetch(`/api/sessions/${sessionId}/rsvps/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFormError(data.error ?? "Failed to save");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setFormError("Request failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#0a0a0a] p-4 shadow-xl"
        role="dialog"
        aria-labelledby="admin-rsvp-title"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 id="admin-rsvp-title" className="text-lg font-medium text-white">
              Edit RSVP — {user.name}
            </h2>
            <p className="text-xs text-[#a0a0a0]">Overrides RSVP deadline and player edits.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-[#a0a0a0] hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {formError && (
            <p className="rounded-lg bg-[#8b1a1a]/30 px-3 py-2 text-sm text-red-200">{formError}</p>
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
                    ["rider", "Needs a ride"],
                    ["driver", "Driving (pickup station)"],
                    ["own", "Own way"],
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
                    label="Pickup station (riders meet here)"
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
                  label="Start location"
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
                      onChange={(e) =>
                        setTransportMode(e.target.value as TransportMode)
                      }
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

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-[#8b1a1a] py-3 font-medium text-white hover:bg-[#a32222] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/20 px-4 py-3 text-white hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
