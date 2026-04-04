"use client";

import { useEffect, useState } from "react";
import { TravelChart } from "@/components/TravelChart";

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

type LeaderboardRow = {
  userId: string;
  name: string;
  totalMin: number;
  sessions: number;
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<string>("");
  const [month, setMonth] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (month) params.set("month", month);
    const qs = params.toString() ? `?${params.toString()}` : "";

    Promise.all([
      fetch(`/api/stats/me${qs}`).then((r) => r.json()),
      fetch(`/api/stats/team/sessions${qs}`).then((r) => r.json()),
      fetch(`/api/stats/team${qs}`).then((r) => r.json()),
    ])
      .then(([me, tm, lb]) => {
        if (me.error) { setError(me.error); return; }
        setPersonal(me);
        if (!tm.error) setTeam(tm);
        if (!lb.error && lb.leaderboard) setLeaderboard(lb.leaderboard);
        setError(null);
      })
      .catch(() => setError("Failed to load stats"));
  }, [year, month]);

  const chartData = personal?.bySession
    .filter((r) => r.travelTimeMin != null)
    .map((r) => ({
      label: r.name.length > 20 ? r.name.slice(0, 18) + "…" : r.name,
      minutes: r.travelTimeMin!,
    })) ?? [];

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Tokyo",
    });
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-10">
      {error && <p className="text-sm text-red-300" role="alert">{error}</p>}

      {/* Date filter */}
      <div className="flex flex-wrap gap-3">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-sm text-white"
        >
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-sm text-white"
        >
          <option value="">All months</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {new Date(2000, m - 1).toLocaleString("en", { month: "long" })}
            </option>
          ))}
        </select>
      </div>

      {/* Personal travel chart */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-lg font-medium text-white">Your travel</h2>
        <p className="mt-1 text-2xl font-semibold text-accent">
          {personal ? `${personal.totalMin} min` : "—"} <span className="text-base font-normal text-muted">total</span>
        </p>
        {personal && personal.bySession.length > 0 && (
          <p className="mt-1 text-sm text-muted">
            Across {personal.bySession.length} session{personal.bySession.length === 1 ? "" : "s"} with travel data
          </p>
        )}
        <div className="mt-4">
          <TravelChart data={chartData} label="Minutes" />
        </div>
        <div className="mt-4 overflow-x-auto">
          {personal && personal.bySession.length === 0 ? (
            <p className="text-sm text-muted">No travel time data yet (RSVP and run optimisation).</p>
          ) : (
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-muted">
                  <th scope="col" className="pb-2 pr-4 font-medium">Session</th>
                  <th scope="col" className="pb-2 pr-4 font-medium">Date</th>
                  <th scope="col" className="pb-2 font-medium text-right">Minutes</th>
                </tr>
              </thead>
              <tbody>
                {personal?.bySession.map((row) => (
                  <tr key={row.sessionId} className="border-b border-white/5 text-white">
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2 pr-4 text-muted">{fmtDate(row.date)}</td>
                    <td className="py-2 text-right tabular-nums">{row.travelTimeMin ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Team leaderboard */}
      {leaderboard && leaderboard.length > 0 && (
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="text-lg font-medium text-white">Team leaderboard</h2>
          <p className="mt-1 text-sm text-muted">Ranked by total travel time</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-muted">
                  <th scope="col" className="pb-2 pr-4 font-medium">#</th>
                  <th scope="col" className="pb-2 pr-4 font-medium">Player</th>
                  <th scope="col" className="pb-2 pr-4 font-medium text-right">Sessions</th>
                  <th scope="col" className="pb-2 pr-4 font-medium text-right">Total min</th>
                  <th scope="col" className="pb-2 font-medium text-right">Avg min</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => (
                  <tr key={row.userId} className="border-b border-white/5 text-white">
                    <td className="py-2 pr-4 text-muted">{i + 1}</td>
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{row.sessions}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{row.totalMin}</td>
                    <td className="py-2 text-right tabular-nums">{row.sessions > 0 ? Math.round(row.totalMin / row.sessions) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Team by session */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-lg font-medium text-white">Team by session</h2>
        <p className="mt-1 text-2xl font-semibold text-accent">
          {team ? `${team.teamTotalMin} min` : "—"}{" "}
          <span className="text-base font-normal text-muted">total travel</span>
        </p>
        <div className="mt-4 overflow-x-auto">
          {team && team.bySession.length === 0 ? (
            <p className="text-sm text-muted">No team travel data yet.</p>
          ) : (
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-muted">
                  <th scope="col" className="pb-2 pr-4 font-medium">Session</th>
                  <th scope="col" className="pb-2 pr-4 font-medium">Date</th>
                  <th scope="col" className="pb-2 font-medium text-right">Team minutes</th>
                </tr>
              </thead>
              <tbody>
                {team?.bySession.map((row) => (
                  <tr key={row.sessionId} className="border-b border-white/5 text-white">
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2 pr-4 text-muted">{fmtDate(row.date)}</td>
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
