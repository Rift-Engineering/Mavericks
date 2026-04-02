"use client";

import type { RSVP, User } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Driver = RSVP & { user: Pick<User, "name"> };
type Rider = RSVP & { user: Pick<User, "name"> };

export function AssignmentEditor({
  sessionId,
  drivers,
  riders,
  initialGroups,
}: {
  sessionId: string;
  drivers: Driver[];
  riders: Rider[];
  initialGroups: { driverRsvpId: string; riderRsvpIds: string[] }[];
}) {
  const router = useRouter();
  const [assign, setAssign] = useState<Record<string, string | "">>(() => {
    const m: Record<string, string | ""> = {};
    for (const r of riders) {
      m[r.id] = "";
    }
    for (const g of initialGroups) {
      for (const rid of g.riderRsvpIds) {
        m[rid] = g.driverRsvpId;
      }
    }
    return m;
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const unassigned = useMemo(
    () => riders.filter((r) => !assign[r.id]),
    [riders, assign],
  );

  function buildGroups(): { driverRsvpId: string; riderRsvpIds: string[] }[] {
    return drivers.map((d) => ({
      driverRsvpId: d.id,
      riderRsvpIds: riders.filter((r) => assign[r.id] === d.id).map((r) => r.id),
    }));
  }

  async function save() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/assignments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: buildGroups() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg bg-[#8b1a1a]/30 px-3 py-2 text-sm text-red-200" role="alert">{error}</p>
      )}

      {unassigned.length > 0 && (
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/30 p-4">
          <h3 className="text-sm font-medium text-amber-200">Unassigned riders</h3>
          <ul className="mt-2 space-y-1 text-sm text-white">
            {unassigned.map((r) => (
              <li key={r.id}>{r.user.name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {riders.map((r) => (
          <div
            key={r.id}
            className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="text-white">{r.user.name}</span>
            <select
              value={assign[r.id] ?? ""}
              onChange={(e) =>
                setAssign((prev) => ({
                  ...prev,
                  [r.id]: e.target.value || "",
                }))
              }
              className="rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-white"
            >
              <option value="">Unassigned</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.user.name} · {d.pickupStation}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void save()}
        disabled={loading}
        className="tap-target w-full rounded-lg bg-[#8b1a1a] py-3 font-medium text-white hover:bg-[#a32222] disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save assignments"}
      </button>
    </div>
  );
}
