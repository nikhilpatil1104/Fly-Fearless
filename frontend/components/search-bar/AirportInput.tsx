"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, X, Plane, Search } from "lucide-react";
import { CURATED_AIRPORTS, loadAirports, searchAirports } from "@/lib/airports";
import type { Airport } from "@/lib/types";

interface Props {
  label: string;
  value: Airport | null;
  onChange: (airport: Airport | null) => void;
  placeholder?: string;
  id?: string;
}

// Group airports by city for Expedia-style dropdown
function groupByCity(airports: Airport[]): { key: string; city: string; country: string; airports: Airport[] }[] {
  const map = new Map<string, Airport[]>();
  for (const a of airports) {
    const key = `${a.city}||${a.country}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return Array.from(map.entries()).map(([k, airports]) => {
    const [city, country] = k.split("||");
    return { key: k, city, country, airports };
  });
}

export default function AirportInput({
  label, value, onChange, placeholder = "City or airport", id,
}: Props) {
  const [query, setQuery]       = useState("");
  const [open, setOpen]         = useState(false);
  const [airports, setAirports] = useState(CURATED_AIRPORTS);
  const [results, setResults]   = useState<Airport[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load full airport list
  useEffect(() => { loadAirports().then(setAirports); }, []);

  // Sync display when value changes
  useEffect(() => {
    if (value) {
      const region = value.country === "US" ? value.state : value.country;
      setQuery(`${value.city}${region ? `, ${region}` : ""} (${value.iata})`);
    } else {
      setQuery("");
    }
  }, [value]);

  // Close on outside click, restore display value
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        if (value) {
          const region = value.country === "US" ? value.state : value.country;
          setQuery(`${value.city}${region ? `, ${region}` : ""} (${value.iata})`);
        }
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [value]);

  // Auto-detect nearest airport via IP (no permission needed)
  // Only runs for "Leaving from" when no value is set
  useEffect(() => {
    if (value || !label.toLowerCase().includes("leaving")) return;
    if (!airports || airports.length < 10) return;

    // Use IP geolocation — free, no user permission
    fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) })
      .then((r) => r.json())
      .then((data) => {
        const lat = parseFloat(data.latitude);
        const lon = parseFloat(data.longitude);
        if (isNaN(lat) || isNaN(lon)) return;

        let closest: Airport | null = null;
        let minDist = Infinity;
        for (const a of airports) {
          if (!a.lat || !a.lon) continue;
          const d = (a.lat - lat) ** 2 + (a.lon - lon) ** 2;
          if (d < minDist) { minDist = d; closest = a; }
        }
        if (closest && !value) {
          onChange(closest);
        }
      })
      .catch(() => {}); // silent fail — no location = no preset
  }, [airports]); // eslint-disable-line

  const handleChange = useCallback((q: string) => {
    setQuery(q);
    setOpen(true);
    setResults(searchAirports(q, airports, 15));
  }, [airports]);

  const handleSelect = useCallback((airport: Airport) => {
    onChange(airport);
    const region = airport.country === "US" ? airport.state : airport.country;
    setQuery(`${airport.city}${region ? `, ${region}` : ""} (${airport.iata})`);
    setOpen(false);
  }, [onChange]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setQuery("");
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSearchFallback = () => {
    // Find best match for typed query
    const matches = searchAirports(query, airports, 1);
    if (matches.length > 0) {
      handleSelect(matches[0]);
    }
  };

  const displayResults = open
    ? (query.trim() ? results : searchAirports("", airports, 8))
    : [];

  const grouped = groupByCity(displayResults);
  const showFallback = open && query.trim().length > 1;

  return (
    <div ref={ref} className="relative flex-1 min-w-0" style={{ zIndex: open ? 400 : "auto" }}>
      <label htmlFor={id}
        className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 px-3 pt-2 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex items-center gap-2 px-3 pb-2.5">
        <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            setOpen(true);
            setResults(searchAirports(query, airports, 15));
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-transparent text-[15px] font-semibold text-gray-900 dark:text-white
                     placeholder:font-normal placeholder:text-gray-400 placeholder:text-sm
                     focus:outline-none truncate"
        />
        {(value || query) && (
          <button
            onMouseDown={(e) => { e.preventDefault(); handleClear(e as any); }}
            className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600
                       flex items-center justify-center
                       hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            aria-label="Clear"
          >
            <X className="w-3 h-3 text-gray-700 dark:text-gray-200" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (grouped.length > 0 || showFallback) && (
        <div
          className="absolute top-full left-0 mt-1
                     bg-white dark:bg-[#1C1F26]
                     rounded-xl shadow-2xl
                     border border-gray-200 dark:border-gray-700
                     overflow-y-auto"
          style={{ zIndex: 9999, width: "460px", maxWidth: "92vw", maxHeight: "380px" }}
        >
          {grouped.map(({ key, city, country, airports: cityAirports }) => {
            const primary = cityAirports[0];
            const region = primary.country === "US" ? primary.state : primary.country;
            const hasMultiple = cityAirports.length > 1;

            return (
              <div key={key}>
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(primary); }}
                  className="w-full flex items-center gap-3 px-4 py-3
                             hover:bg-blue-50 dark:hover:bg-gray-800
                             text-left transition-colors
                             border-b border-gray-100 dark:border-gray-800"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Plane className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-[var(--sky-primary)]">
                      {city}{region ? `, ${region}` : ""}{" "}
                      <span className="font-semibold text-gray-500 dark:text-gray-400 text-[13px]">
                        ({primary.iata}{hasMultiple ? " · All Airports" : ""})
                      </span>
                    </div>
                    <div className="text-[12px] text-gray-500 dark:text-gray-400 truncate">{primary.name}</div>
                  </div>
                  <span className="text-[11px] font-medium text-gray-400 flex-shrink-0">{country}</span>
                </button>

                {hasMultiple && cityAirports.slice(1).map((sub) => (
                  <button
                    key={sub.iata}
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(sub); }}
                    className="w-full flex items-center gap-3 pl-10 pr-4 py-2.5
                               hover:bg-blue-50 dark:hover:bg-gray-800
                               text-left transition-colors
                               border-b border-gray-100 dark:border-gray-800"
                  >
                    <span className="text-gray-400 text-base flex-shrink-0">↳</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[var(--sky-primary)]">
                        {sub.city}{" "}
                        <span className="font-semibold text-gray-500 dark:text-gray-400">({sub.iata})</span>
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">{sub.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}

          {/* Search for "X" */}
          {showFallback && (
            <button
              onMouseDown={(e) => { e.preventDefault(); handleSearchFallback(); }}
              className="w-full flex items-center gap-3 px-4 py-3
                         hover:bg-blue-50 dark:hover:bg-gray-800
                         text-left transition-colors border-t border-gray-200 dark:border-gray-700"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
                <Search className="w-4 h-4 text-[var(--sky-primary)]" />
              </div>
              <span className="text-[14px] font-semibold text-[var(--sky-primary)]">
                Search for &quot;{query}&quot;
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
