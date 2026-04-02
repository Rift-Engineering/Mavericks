"use client";

import { useEffect, useState } from "react";

type PersonalRow = {
  sessionId: string;
  name: string;
  date: string;
  travelTimeMin: number | null;
};

type TeamRow = {
  sessionId: string;
  name: string;
  date: string;
  teamTravelMin: number;
};

export function StatsClient() {
  const [personal, setPersonal] = useState<{
    totalMin: number;
    bySession: PersonalRow[];
  } | null>(null);
  const [team, setTeam] = useState<{
    teamTotalMin: number;
    bySession: TeamRow[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats/me").then((r) => r.json()),
      fetch("/api/stats/team/sessions").then((r) => r.json()),
    ])
      .then(([me, tm]) => {
        if (me.error) {
          setError(me.error);
          return;
        }
        setPersonal(me);
        if (tm.error) {
          setError(tm.error);
          return;
        }
        setError(null);
        setTeam(tm);
      })
      .catch(() => setError("Failed to load stats"));
  }, []);

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-10">
      {error && <p className="text-sm text-red-300">{error}</p>}

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-lg font-medium text-white">Your travel</h2>
        <p className="mt-1 text-2xl font-semibold text-[#8b1a1a]">
          {personal ? `${personal.totalMin} min` : "—"} <span className="text-base font-normal text-[#a0a0a0]">total</span>
        </p>
        {personal && personal.bySession.length > 0 && (
          <p className="mt-1 text-sm text-[#a0a0a0]">
            Across {personal.bySession.length} session{personal.bySession.length === 1 ? "" : "s"} with travel data
          </p>
        )}
        <div className="mt-4 overflow-x-auto">
          {personal && personal.bySession.length === 0 ? (
            <p className="text-sm text-[#a0a0a0]">No travel time data yet (RSVP and run optimisation).</p>
          ) : (
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[#a0a0a0]">
                  <th className="pb-2 pr-4 font-medium">Session</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 font-medium text-right">Minutes</th>
                </tr>
              </thead>
              <tbody>
                {personal?.bySession.map((row) => (
                  <tr key={row.sessionId} className="border-b border-white/5 text-white">
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2 pr-4 text-[#a0a0a0]">{fmtDate(row.date)}</td>
                    <td className="py-2 text-right tabular-nums">{row.travelTimeMin ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-lg font-medium text-white">Team (everyone)</h2>
        <p className="mt-1 text-2xl font-semibold text-[#8b1a1a]">
          {team ? `${team.teamTotalMin} min` : "—"}{" "}
          <span className="text-base font-normal text-[#a0a0a0]">total travel</span>
        </p>
        <p className="mt-1 text-sm text-[#a0a0a0]">
          Sum of door-to-venue travel minutes for all players with saved travel times, per session and overall.
        </p>
        <div className="mt-4 overflow-x-auto">
          {team && team.bySession.length === 0 ? (
            <p className="text-sm text-[#a0a0a0]">No team travel data yet.</p>
          ) : (
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[#a0a0a0]">
                  <th className="pb-2 pr-4 font-medium">Session</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 font-medium text-right">Team minutes</th>
                </tr>
              </thead>
              <tbody>
                {team?.bySession.map((row) => (
                  <tr key={row.sessionId} className="border-b border-white/5 text-white">
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2 pr-4 text-[#a0a0a0]">{fmtDate(row.date)}</td>
                    <td className="py-2 text-right tabular-nums">{row.teamTravelMin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
