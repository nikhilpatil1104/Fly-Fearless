"use client";

// ── AirportCongestion ────────────────────────────────────────────────────────
interface AirportData {
  iata: string; name: string; city: string;
  congestionScore: number; level: "low" | "medium" | "high";
  peakHours: number[]; avgSecurityMinutes: number; gatesOpen: number;
}

export function AirportCongestion({ airports }: { airports: AirportData[] }) {
  const levelColor = (l: string) =>
    l === "high" ? "bg-red-500" : l === "medium" ? "bg-amber-400" : "bg-green-500";
  const levelText = (l: string) =>
    l === "high" ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
    : l === "medium" ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40"
    : "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40";

  const formatHour = (h: number) =>
    h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;

  return (
    <div className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Airport Congestion</h3>
        <p className="text-sm text-gray-500">Congestion ranking with peak hours</p>
      </div>
      <div className="space-y-3">
        {airports.map((a, i) => (
          <div key={a.iata} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40">
            <span className="text-xl font-black text-gray-200 dark:text-gray-700 w-6 text-center">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-bold text-sm text-gray-900 dark:text-white">{a.iata}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${levelText(a.level)}`}>
                  {a.level}
                </span>
                <span className="text-xs text-gray-500 ml-auto">~{a.avgSecurityMinutes} min security</span>
              </div>
              {/* Congestion meter */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${levelColor(a.level)} transition-all`}
                  style={{ width: `${a.congestionScore}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-gray-400">{a.city}</span>
                <span className="text-[10px] text-gray-400">
                  Peak: {a.peakHours.map(formatHour).join(", ")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── WeatherSeverity ──────────────────────────────────────────────────────────
interface MonthData {
  month: string; monthIndex: number;
  riskScore: number; level: "low" | "medium" | "high";
  disruptionPercent: number; factors: string[];
}

export function WeatherSeverity({ months, origin, destination }: { months: MonthData[]; origin: string; destination: string }) {
  const bgCell = (level: string) =>
    level === "high" ? "bg-red-400 dark:bg-red-600"
    : level === "medium" ? "bg-amber-300 dark:bg-amber-500"
    : "bg-green-300 dark:bg-green-600";

  return (
    <div className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Weather Disruption Risk</h3>
        <p className="text-sm text-gray-500">
          {origin} → {destination} · 12-month disruption probability
        </p>
      </div>

      {/* 12-month calendar heatmap */}
      <div className="grid grid-cols-6 gap-2 mb-6">
        {months.map((m) => (
          <div
            key={m.month}
            className={`${bgCell(m.level)} rounded-xl p-3 text-center relative group cursor-default`}
            title={`${m.month}: ${m.disruptionPercent}% disruption risk${m.factors.length ? ` · ${m.factors.join(", ")}` : ""}`}
          >
            <p className="text-[11px] font-bold text-white">{m.month}</p>
            <p className="text-[10px] text-white/80 mt-0.5">{m.disruptionPercent}%</p>
            {/* Hover tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block
                            bg-gray-900 text-white text-[10px] rounded-lg px-2 py-1.5 whitespace-nowrap z-10 shadow-xl">
              {m.factors.length ? m.factors.join(" · ") : "Low risk"}
            </div>
          </div>
        ))}
      </div>

      {/* Legend + insight */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-400" /> Low (&lt;20%)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400" /> Medium (20–40%)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400" /> High (&gt;40%)</span>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 text-sm">
        <p className="font-bold text-gray-900 dark:text-white mb-1">🌤 Travel Tip</p>
        <p className="text-gray-600 dark:text-gray-400 text-xs">
          {months.filter((m) => m.level === "low").map((m) => m.month).join(", ")} offer the lowest disruption risk on this route.
          Avoid {months.filter((m) => m.level === "high").map((m) => m.month).join(", ")} if schedule flexibility is important.
        </p>
      </div>
    </div>
  );
}
