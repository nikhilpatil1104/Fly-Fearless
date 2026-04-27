"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { AirlineReliability } from "@/lib/types";

interface Props { data: AirlineReliability[]; }

function color(pct: number) {
  if (pct >= 85) return "#007A33";
  if (pct >= 70) return "#FFC107";
  return "#DC2626";
}

export default function AirlineReliabilityChart({ data }: Props) {
  const [sort, setSort] = useState<"onTime" | "cancel" | "delay">("onTime");

  const sorted = [...data].sort((a, b) => {
    if (sort === "onTime") return b.onTimePercent - a.onTimePercent;
    if (sort === "cancel") return a.cancellationRate - b.cancellationRate;
    return a.avgDelayMinutes - b.avgDelayMinutes;
  });

  return (
    <div className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Airline Reliability</h3>
          <p className="text-sm text-gray-500">On-time performance by carrier</p>
        </div>
        <div className="flex gap-2">
          {([["onTime", "On-time %"], ["cancel", "Cancellations"], ["delay", "Avg delay"]] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                sort === k
                  ? "bg-[var(--sky-primary)] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={sorted} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="code" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v: number) => [`${v}${sort === "delay" ? " min" : "%"}`, sort === "onTime" ? "On-time" : sort === "cancel" ? "Cancellations" : "Avg delay"]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
          />
          <Bar dataKey={sort === "onTime" ? "onTimePercent" : sort === "cancel" ? "cancellationRate" : "avgDelayMinutes"} radius={[4, 4, 0, 0]}>
            {sorted.map((entry) => (
              <Cell key={entry.code} fill={color(entry.onTimePercent)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#007A33]" /> &gt;85% on-time</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#FFC107]" /> 70–85%</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#DC2626]" /> &lt;70%</span>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left pb-2 font-medium">Airline</th>
              <th className="text-right pb-2 font-medium">On-time %</th>
              <th className="text-right pb-2 font-medium">Cancel rate</th>
              <th className="text-right pb-2 font-medium">Avg delay</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a) => (
              <tr key={a.code} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                <td className="py-2.5 text-gray-900 dark:text-white font-medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: color(a.onTimePercent) }} />
                    {a.name}
                  </span>
                </td>
                <td className="py-2.5 text-right font-semibold" style={{ color: color(a.onTimePercent) }}>
                  {a.onTimePercent}%
                </td>
                <td className="py-2.5 text-right text-gray-600 dark:text-gray-400">{a.cancellationRate}%</td>
                <td className="py-2.5 text-right text-gray-600 dark:text-gray-400">{a.avgDelayMinutes} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
