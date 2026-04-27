"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal, Bell } from "lucide-react";
import type { FlightOffer } from "@/lib/types";

export interface Filters {
  stops: Set<number>;
  airlines: Set<string>;
  maxPrice: number;
  maxDuration: number; // minutes
  depTimes: Set<string>;
  arrTimes: Set<string>;
  carryOnOnly: boolean;
  checkedBagOnly: boolean;
  refundableOnly: boolean;
}

export function defaultFilters(): Filters {
  return {
    stops: new Set([0, 1, 2]),
    airlines: new Set<string>(),
    maxPrice: 9999,
    maxDuration: 9999,
    depTimes: new Set<string>(),
    arrTimes: new Set<string>(),
    carryOnOnly: false,
    checkedBagOnly: false,
    refundableOnly: false,
  };
}

interface Props {
  flights: FlightOffer[];
  filters: Filters;
  onChange: (f: Filters) => void;
  cheapestPrice: number;
  maxPrice: number;
}

// ── Helper: parse "2h 30m" → minutes ────────────────────────────────────────
function parseMins(dur: string): number {
  if (!dur) return 0;
  const h = dur.match(/(\d+)h/);
  const m = dur.match(/(\d+)m/);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
}

function fmtMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

function depHour(iso: string): number {
  try { return new Date(iso).getHours(); } catch { return 0; }
}

function timeSlotOf(hour: number): string {
  if (hour >= 5  && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18)               return "evening";
  return "night";
}

// ── Section wrapper with animated expand/collapse ────────────────────────────
function Section({
  title, fromLabel, children, defaultOpen = true,
}: {
  title: string; fromLabel?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 py-4 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between mb-0 group"
      >
        <span className="text-[13px] font-bold text-gray-900 dark:text-white">{title}</span>
        <div className="flex items-center gap-2">
          {fromLabel && !open && (
            <span className="text-[12px] text-gray-400">{fromLabel}</span>
          )}
          {open
            ? <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors" />
            : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors" />}
        </div>
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? "600px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="pt-3">{children}</div>
      </div>
    </div>
  );
}

// ── Checkbox row ─────────────────────────────────────────────────────────────
function CheckRow({
  label, sublabel, fromPrice, checked, onChange, count,
}: {
  label: string; sublabel?: string; fromPrice?: number;
  checked: boolean; onChange: (v: boolean) => void; count?: number;
}) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
      {/* Real hidden input so label click works */}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
        checked
          ? "bg-[var(--sky-primary)] border-[var(--sky-primary)]"
          : "border-gray-400 dark:border-gray-500 group-hover:border-[var(--sky-primary)]"
      }`}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[13px] text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white truncate">
            {label}
          </span>
          {count !== undefined && (
            <span className="text-[11px] text-gray-400 flex-shrink-0">({count})</span>
          )}
        </div>
        {sublabel && <span className="text-[11px] text-gray-400">{sublabel}</span>}
      </div>
      {fromPrice !== undefined && (
        <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">
          ${fromPrice}
        </span>
      )}
    </label>
  );
}

// ── Time slot grid button ────────────────────────────────────────────────────
const TIME_SLOTS = [
  { key: "morning",   label: "Morning",   sub: "5am–12pm", icon: "🌅" },
  { key: "afternoon", label: "Afternoon", sub: "12pm–6pm", icon: "☀️" },
  { key: "evening",   label: "Evening",   sub: "6pm–12am", icon: "🌆" },
  { key: "night",     label: "Night",     sub: "12am–5am", icon: "🌙" },
];

export default function FiltersPanel({ flights, filters, onChange, cheapestPrice, maxPrice }: Props) {
  if (!filters?.stops) return null;

  // ── Derived stats from live flights ─────────────────────────────────────
  const stopStats = useMemo(() => {
    const map = new Map<number, { count: number; minPrice: number }>();
    flights.forEach((f) => {
      const s = Math.min(f.outbound.stops, 2);
      const p = f.price;
      const cur = map.get(s) ?? { count: 0, minPrice: Infinity };
      map.set(s, { count: cur.count + 1, minPrice: Math.min(cur.minPrice, p) });
    });
    return map;
  }, [flights]);

  const airlineStats = useMemo(() => {
    const map = new Map<string, { count: number; minPrice: number; name: string }>();
    flights.forEach((f) => {
      const code = f.airline;
      const name = (f as any).airlineName ?? code;
      const cur = map.get(code) ?? { count: 0, minPrice: Infinity, name };
      map.set(code, { count: cur.count + 1, minPrice: Math.min(cur.minPrice, f.price), name });
    });
    return Array.from(map.entries()).sort((a, b) => a[1].minPrice - b[1].minPrice);
  }, [flights]);

  const durationStats = useMemo(() => {
    const mins = flights.map((f) => parseMins(f.outbound.duration)).filter(Boolean);
    return {
      min: mins.length ? Math.min(...mins) : 60,
      max: mins.length ? Math.max(...mins) : 960,
    };
  }, [flights]);

  const effectiveMaxDur = filters.maxDuration >= 9999
    ? durationStats.max
    : filters.maxDuration;

  // ── Togglers ─────────────────────────────────────────────────────────────
  const toggleStop = (s: number) => {
    const next = new Set(filters.stops);
    next.has(s) ? next.delete(s) : next.add(s);
    onChange({ ...filters, stops: next });
  };

  const toggleAirline = (code: string) => {
    const next = new Set(filters.airlines);
    next.has(code) ? next.delete(code) : next.add(code);
    onChange({ ...filters, airlines: next });
  };

  const toggleDepTime = (t: string) => {
    const next = new Set(filters.depTimes);
    next.has(t) ? next.delete(t) : next.add(t);
    onChange({ ...filters, depTimes: next });
  };

  const toggleArrTime = (t: string) => {
    const next = new Set(filters.arrTimes);
    next.has(t) ? next.delete(t) : next.add(t);
    onChange({ ...filters, arrTimes: next });
  };

  const activeCount = [
    filters.stops.size < 3,
    filters.airlines.size > 0 && filters.airlines.size < airlineStats.length,
    filters.maxPrice < maxPrice,
    filters.maxDuration < durationStats.max,
    filters.depTimes.size > 0,
    filters.arrTimes.size > 0,
    filters.carryOnOnly,
    filters.checkedBagOnly,
    filters.refundableOnly,
  ].filter(Boolean).length;

  return (
    <aside className="w-64 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">Filters</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[var(--sky-primary)] text-white text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={() => onChange({
              ...defaultFilters(),
              airlines: new Set(airlineStats.map(([code]) => code)),
            })}
            className="text-[12px] font-semibold text-[var(--sky-primary)] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* ── Price Tracking card ─────────────────────────────────────────── */}
      {cheapestPrice > 0 && (
        <div className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-[var(--sky-primary)]" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">Price Tracking</span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Current lowest:{" "}
            <span className="font-bold text-[var(--sky-green)]">${cheapestPrice}</span>
          </p>
          {/* Sparkline */}
          <svg viewBox="0 0 160 32" className="w-full h-8 mb-2">
            <polyline
              fill="none"
              stroke="var(--sky-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={`0,24 40,20 80,28 120,12 160,16`}
            />
            <circle cx="120" cy="12" r="3" fill="var(--sky-green)" />
          </svg>
          <button className="text-xs font-semibold text-[var(--sky-primary)] hover:underline">
            Watch prices
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl px-4 divide-y-0">

        {/* ── Stops ─────────────────────────────────────────────────── */}
        <Section title="Stops">
          {[
            { s: 0, label: "Nonstop" },
            { s: 1, label: "1 stop" },
            { s: 2, label: "2+ stops" },
          ].map(({ s, label }) => {
            const info = stopStats.get(s);
            return (
              <CheckRow
                key={s}
                label={label}
                count={info?.count}
                fromPrice={info ? Math.round(info.minPrice) : undefined}
                checked={filters.stops.has(s)}
                onChange={() => toggleStop(s)}
              />
            );
          })}
        </Section>

        {/* ── Price range ────────────────────────────────────────────── */}
        {maxPrice > 0 && (
          <Section title="Price per traveler" fromLabel={`Up to $${filters.maxPrice < 9999 ? filters.maxPrice : maxPrice}`}>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>${Math.round(cheapestPrice) || 0}</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  Up to ${filters.maxPrice < 9999 ? Math.round(filters.maxPrice) : Math.round(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                min={cheapestPrice || 0}
                max={maxPrice || 1000}
                step={10}
                value={filters.maxPrice < 9999 ? filters.maxPrice : maxPrice}
                onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
                className="w-full h-1.5 rounded-full accent-[var(--sky-primary)] cursor-pointer"
              />
            </div>
          </Section>
        )}

        {/* ── Duration slider ────────────────────────────────────────── */}
        {durationStats.max > 0 && (
          <Section title="Total travel time" fromLabel={`Up to ${fmtMins(effectiveMaxDur)}`}>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>{fmtMins(durationStats.min)}</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  Up to {fmtMins(effectiveMaxDur)}
                </span>
              </div>
              <input
                type="range"
                min={durationStats.min}
                max={durationStats.max}
                step={15}
                value={effectiveMaxDur}
                onChange={(e) =>
                  onChange({ ...filters, maxDuration: Number(e.target.value) })
                }
                className="w-full h-1.5 rounded-full accent-[var(--sky-primary)] cursor-pointer"
              />
            </div>
          </Section>
        )}

        {/* ── Airlines ──────────────────────────────────────────────── */}
        {airlineStats.length > 0 && (
          <Section title="Airlines">
            {airlineStats.map(([code, info]) => (
              <CheckRow
                key={code}
                label={info.name}
                count={info.count}
                fromPrice={Math.round(info.minPrice)}
                checked={filters.airlines.has(code)}
                onChange={() => toggleAirline(code)}
              />
            ))}
          </Section>
        )}

        {/* ── Travel & Baggage ───────────────────────────────────────── */}
        <Section title="Travel and baggage" defaultOpen={true}>
          <CheckRow
            label="Carry-on bag included"
            checked={filters.carryOnOnly}
            onChange={(v) => onChange({ ...filters, carryOnOnly: v })}
          />
          <CheckRow
            label="Checked bag included"
            checked={filters.checkedBagOnly}
            onChange={(v) => onChange({ ...filters, checkedBagOnly: v })}
          />
          <CheckRow
            label="Refundable"
            checked={filters.refundableOnly}
            onChange={(v) => onChange({ ...filters, refundableOnly: v })}
          />
        </Section>

        {/* ── Departure time ─────────────────────────────────────────── */}
        <Section title="Departure time" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-1.5">
            {TIME_SLOTS.map((t) => (
              <button
                key={t.key}
                onClick={() => toggleDepTime(t.key)}
                className={`px-2 py-2.5 rounded-xl text-left border transition-all duration-150 ${
                  filters.depTimes.has(t.key)
                    ? "border-[var(--sky-primary)] bg-blue-50 dark:bg-blue-950/40"
                    : "border-gray-200 dark:border-gray-700 hover:border-[var(--sky-primary)]/50"
                }`}
              >
                <div className="text-base mb-0.5">{t.icon}</div>
                <p className={`text-[12px] font-semibold ${
                  filters.depTimes.has(t.key)
                    ? "text-[var(--sky-primary)]"
                    : "text-gray-800 dark:text-gray-200"
                }`}>{t.label}</p>
                <p className="text-[10px] text-gray-400">{t.sub}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* ── Arrival time ───────────────────────────────────────────── */}
        <Section title="Arrival time" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-1.5">
            {TIME_SLOTS.map((t) => (
              <button
                key={t.key}
                onClick={() => toggleArrTime(t.key)}
                className={`px-2 py-2.5 rounded-xl text-left border transition-all duration-150 ${
                  filters.arrTimes.has(t.key)
                    ? "border-[var(--sky-primary)] bg-blue-50 dark:bg-blue-950/40"
                    : "border-gray-200 dark:border-gray-700 hover:border-[var(--sky-primary)]/50"
                }`}
              >
                <div className="text-base mb-0.5">{t.icon}</div>
                <p className={`text-[12px] font-semibold ${
                  filters.arrTimes.has(t.key)
                    ? "text-[var(--sky-primary)]"
                    : "text-gray-800 dark:text-gray-200"
                }`}>{t.label}</p>
                <p className="text-[10px] text-gray-400">{t.sub}</p>
              </button>
            ))}
          </div>
        </Section>

      </div>
    </aside>
  );
}
