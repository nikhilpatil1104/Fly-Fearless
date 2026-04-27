"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface HourlyData { hour: number; label: string; avgDelayMinutes: number; onTimePercent: number; }
interface WeeklyData { day: string; avgDelayMinutes: number; }
interface Insight { bestDayToBook: string; bestAdvanceDays: string; bestTimeOfDay: string; insight: string; }

interface Props {
  hourly: HourlyData[];
  weekly: WeeklyData[];
  insight: Insight;
}

function delayColor(delay: number) {
  if (delay < 12) return "#007A33";
  if (delay < 22) return "#FFC107";
  return "#DC2626";
}

export default function TimeRecommendation({ hourly, weekly, insight }: Props) {
  return (
    <div className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Best Time to Fly</h3>
        <p className="text-sm text-gray-500">Average delay by departure hour and day</p>
      </div>

      {/* Hourly heatmap as coloured bars */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By hour of day</p>
        <div className="flex gap-0.5 items-end h-16">
          {hourly.map((h) => {
            const heightPct = (h.avgDelayMinutes / 35) * 100;
            return (
              <div
                key={h.hour}
                className="flex-1 rounded-sm flex flex-col justify-end relative group cursor-default"
                title={`${h.label}: ${h.avgDelayMinutes} min avg delay`}
              >
                <div
                  style={{ height: `${heightPct}%`, backgroundColor: delayColor(h.avgDelayMinutes) }}
                  className="rounded-sm transition-opacity group-hover:opacity-80"
                />
                {h.hour % 6 === 0 && (
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400">
                    {h.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-7 text-[10px] text-gray-400">
          {["12am", "6am", "12pm", "6pm", "12am"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By day of week</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={weekly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit=" min" />
            <Tooltip formatter={(v: number) => [`${v} min`, "Avg delay"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="avgDelayMinutes" radius={[4, 4, 0, 0]}
              fill="var(--sky-primary)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insight card */}
      <div className="bg-blue-50 dark:bg-blue-950/40 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300">
        <p className="font-bold text-gray-900 dark:text-white mb-2">✈ Booking Insight</p>
        <p className="mb-1">Best day to book: <span className="font-semibold">{insight.bestDayToBook}</span></p>
        <p className="mb-1">Book <span className="font-semibold">{insight.bestAdvanceDays}</span> in advance</p>
        <p className="mb-2">Cheapest departures: <span className="font-semibold">{insight.bestTimeOfDay}</span></p>
        <p className="text-xs text-gray-500">{insight.insight}</p>
      </div>
    </div>
  );
}
