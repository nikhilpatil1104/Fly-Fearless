"use client";

/**
 * SearchHistoryPage  —  /history
 *
 * Reads from localStorage (key: "skyrisk_search_history").
 * Shows each past search as a "Currently Analyzing"-style card
 * identical to the SkyRisk dark card in image 2.
 *
 * No Supabase required.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar/Navbar";
import { Clock, Trash2, Search } from "lucide-react";

// ─── Shared types & helpers (copy these into a lib/searchHistory.ts if you want)

const HISTORY_KEY = "skyrisk_search_history";
const MAX_HISTORY  = 8;

export interface SearchHistoryEntry {
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  tripType: string;
  depDate: string;
  retDate?: string;
  adults: number;
  cabin: string;
  airline?: string;         // risk label source — optional
  riskLabel?: string;       // "Low Risk" | "Medium Risk" | "High Risk"
  searchedAt: string;       // ISO string
}

/** Call this from your HeroSection / search handler right before navigating. */
export function saveSearchToHistory(entry: Omit<SearchHistoryEntry, "searchedAt">) {
  try {
    const raw       = localStorage.getItem(HISTORY_KEY);
    const existing: SearchHistoryEntry[] = raw ? JSON.parse(raw) : [];

    // Remove prior exact duplicate (same route + trip type)
    const deduped = existing.filter(
      (e) =>
        !(
          e.origin === entry.origin &&
          e.destination === entry.destination &&
          e.tripType === entry.tripType
        )
    );

    const updated = [
      { ...entry, searchedAt: new Date().toISOString() },
      ...deduped,
    ].slice(0, MAX_HISTORY);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (SSR / private mode) — silent fail
  }
}

export function getSearchHistory(): SearchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
}

// ─── Risk badge colours ───────────────────────────────────────────────────────

function riskBadge(label?: string) {
  if (!label) return null;
  const map: Record<string, { dot: string; text: string; border: string }> = {
    "Low Risk":    { dot: "#4ade80", text: "#4ade80", border: "rgba(74,222,128,0.35)"  },
    "Medium Risk": { dot: "#fbbf24", text: "#fbbf24", border: "rgba(251,191,36,0.35)"  },
    "High Risk":   { dot: "#f87171", text: "#f87171", border: "rgba(248,113,113,0.35)" },
  };
  const colours = map[label] ?? map["Medium Risk"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 999,
        border: `1px solid ${colours.border}`,
        fontSize: 12,
        fontWeight: 600,
        color: colours.text,
        background: "rgba(255,255,255,0.04)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: colours.dot,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  // Only read localStorage client-side
  useEffect(() => {
    setMounted(true);
    setHistory(getSearchHistory());
  }, []);

  const handleClear = () => {
    clearSearchHistory();
    setHistory([]);
  };

  const handleSearch = (entry: SearchHistoryEntry) => {
    const params = new URLSearchParams({
      origin:      entry.origin,
      destination: entry.destination,
      tripType:    entry.tripType,
      adults:      String(entry.adults),
      cabin:       entry.cabin,
      dep:         entry.depDate,
      ...(entry.retDate ? { ret: entry.retDate } : {}),
    });
    router.push(`/flights/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[var(--sky-bg)]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search History</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Your last {MAX_HISTORY} searches — saved locally on this device
            </p>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          )}
        </div>

        {/* Empty state */}
        {mounted && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Clock className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No searches yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
              Your searches will appear here after you look up a flight.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-6 px-5 py-2 rounded-full text-sm font-medium bg-[var(--sky-primary)] text-white hover:opacity-90 transition"
            >
              Search flights
            </button>
          </div>
        )}

        {/* History cards — styled like the SkyRisk "Currently Analyzing" card */}
        {mounted && history.length > 0 && (
          <div className="space-y-3">
            {history.map((entry, i) => (
              <div
                key={i}
                style={{
                  background: "#0d1117",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderLeft: "3px solid #2563eb",
                  padding: "18px 22px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  cursor: "pointer",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                className="group hover:border-l-[var(--sky-primary)] hover:shadow-md hover:shadow-blue-900/20"
                onClick={() => handleSearch(entry)}
              >
                {/* Left: label + route + meta */}
                <div className="flex-1 min-w-0">
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#6b7280",
                      marginBottom: 4,
                    }}
                  >
                    {i === 0 ? "Most recent search" : relativeTime(entry.searchedAt)}
                  </div>

                  {/* Route line — the big text from image 2 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 17,
                      fontWeight: 700,
                      color: "#f9fafb",
                      marginBottom: 3,
                    }}
                  >
                    <span>{entry.origin}</span>
                    <span style={{ color: "#6b7280", fontSize: 14 }}>→</span>
                    <span>{entry.destination}</span>
                  </div>

                  {/* Sub-line: airline or city names · trip type */}
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    {entry.originCity && entry.destinationCity
                      ? `${entry.originCity} → ${entry.destinationCity}`
                      : entry.airline ?? ""}
                    {" · "}
                    {entry.tripType}
                    {" · "}
                    {entry.depDate}
                    {entry.retDate ? ` → ${entry.retDate}` : ""}
                  </div>
                </div>

                {/* Right: risk badge OR search-again icon */}
                <div className="flex-shrink-0 flex items-center gap-3">
                  {entry.riskLabel
                    ? riskBadge(entry.riskLabel)
                    : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "4px 12px",
                          borderRadius: 999,
                          border: "1px solid rgba(37,99,235,0.35)",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#60a5fa",
                          background: "rgba(37,99,235,0.08)",
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Search className="w-3 h-3" />
                        Search again
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
