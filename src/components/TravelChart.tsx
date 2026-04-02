"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function TravelChart({
  data,
  label,
}: {
  data: { label: string; minutes: number }[];
  label: string;
}) {
  if (data.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 p-6 text-center text-[#a0a0a0]">
        No travel time data for this period yet.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="label" tick={{ fill: "#a0a0a0", fontSize: 11 }} />
          <YAxis tick={{ fill: "#a0a0a0", fontSize: 11 }} label={{ value: label, fill: "#a0a0a0", angle: -90, position: "insideLeft" }} />
          <Tooltip
            contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }}
            labelStyle={{ color: "#fff" }}
          />
          <Bar dataKey="minutes" fill="#8b1a1a" radius={[4, 4, 0, 0]} name="Minutes" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
