"use client";

import { useEffect, useState } from "react";
import { TravelChart } from "@/components/TravelChart";

export function StatsClient() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [personal, setPersonal] = useState<{ totalMin: number; bySession: { name: string; date: string; travelTimeMin: number | null }[] } | null>(null);
  const [team, setTeam] = useState<{ name: string; totalMin: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = `year=${year}&month=${month}`;
    setError(null);
    Promise.all([
      fetch(`/api/stats/me?${q}`).then((r) => r.json()),
      fetch(`/api/stats/team?${q}`).then((r) => r.json()),
    ])
      .then(([me, tm]) => {
        if (me.error) setError(me.error);
        else setPersonal(me);
        if (tm.leaderboard) {
          setTeam(tm.leaderboard.map((x: { name: string; totalMin: number }) => ({ name: x.name, totalMin: x.totalMin })));
        }
      })
      .catch(() => setError("Failed to load stats"));
  }, [year, month]);

  const chartData =
    personal?.bySession.map((s) => ({
      label: new Date(s.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      minutes: s.travelTimeMin ?? 0,
    })) ?? [];

  const teamChart =
    team?.map((t) => ({
      label: t.name.split(" ")[0] ?? t.name,
      minutes: t.totalMin,
    })) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="text-xs text-[#a0a0a0]">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-1 block rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-white"
          >
            {[0, 1, 2].map((o) => {
              const y = now.getFullYear() - o;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#a0a0a0]">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="mt-1 block rounded-lg border border-white/15 bg-[#0a0a0a] px-3 py-2 text-white"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString("en-GB", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-lg font-medium text-white">Your month</h2>
        <p className="mt-1 text-2xl font-semibold text-[#8b1a1a]">
          {personal?.totalMin ?? "—"} min total
        </p>
        <div className="mt-4">
          <TravelChart data={chartData} label="min" />
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-lg font-medium text-white">Team leaderboard</h2>
        <div className="mt-4">
          <TravelChart data={teamChart} label="min" />
        </div>
      </section>
    </div>
  );
}
