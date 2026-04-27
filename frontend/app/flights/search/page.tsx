"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, Check } from "lucide-react";
import Navbar from "@/components/navbar/Navbar";
import SearchBar from "@/components/search-bar/SearchBar";
import StickySearchBar from "@/components/search-bar/StickySearchBar";
import FlightCard from "@/components/flight-card/FlightCard";
import FiltersPanel, { defaultFilters } from "@/components/filters-panel/FiltersPanel";
import type { Filters } from "@/components/filters-panel/FiltersPanel";
import ChatBubble from "@/components/chat-bubble/ChatBubble";
import { searchFlights, getFlexibleDates } from "@/lib/api";
import { saveSearch } from "@/lib/supabase";
import { useStickyObserver } from "@/lib/hooks";
import { CURATED_AIRPORTS } from "@/lib/airports";
import type { FlightOffer, SearchState } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseMins(dur: string): number {
  if (!dur) return 9999;
  const h = dur.match(/(\d+)h/);
  const m = dur.match(/(\d+)m/);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
}
function depHour(iso: string): number {
  try { return new Date(iso).getHours(); } catch { return 0; }
}
function timeSlotOf(hour: number): string {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18) return "evening";
  return "night";
}

// ── Sort options — full Expedia parity ────────────────────────────────────────
type SortKey = "recommended" | "price_asc" | "price_desc" | "duration_asc" | "duration_desc" | "dep_asc" | "dep_desc" | "arr_asc" | "arr_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recommended",   label: "Recommended" },
  { value: "price_asc",     label: "Price (lowest to highest)" },
  { value: "price_desc",    label: "Price (highest to lowest)" },
  { value: "duration_asc",  label: "Duration (shortest)" },
  { value: "duration_desc", label: "Duration (longest)" },
  { value: "dep_asc",       label: "Departure (earliest)" },
  { value: "dep_desc",      label: "Departure (latest)" },
  { value: "arr_asc",       label: "Arrival (earliest)" },
  { value: "arr_desc",      label: "Arrival (latest)" },
];

// ── Animated sort dropdown ────────────────────────────────────────────────────
function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SORT_OPTIONS.find((o) => o.value === value)!;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl
                   border-2 border-gray-200 dark:border-gray-700
                   bg-white dark:bg-[#1C1F26]
                   text-sm font-semibold text-gray-900 dark:text-white
                   hover:border-[var(--sky-primary)] transition-colors
                   min-w-[220px] justify-between"
      >
        <span>Sort by: <span className="text-[var(--sky-primary)]">{current.label}</span></span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-1 z-[300]
                       w-64 bg-white dark:bg-[#1C1F26]
                       rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700
                       overflow-hidden py-1"
          >
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors
                  ${opt.value === value
                    ? "bg-blue-50 dark:bg-blue-950/40 text-[var(--sky-primary)] font-semibold"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
                  }`}
              >
                {opt.label}
                {opt.value === value && <Check className="w-4 h-4 text-[var(--sky-primary)]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-24" />
        </div>
      </div>
    </div>
  );
}

// ── Active filter chips (like Expedia's "Delta ×") ────────────────────────────
function ActiveFilterChips({
  flights, filters, onChange,
}: {
  flights: FlightOffer[];
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const allAirlines = useMemo(() => new Set(flights.map((f) => f.airline)), [flights]);
  const chips: { label: string; onRemove: () => void }[] = [];

  // Stops chips
  const allStops = new Set([0, 1, 2]);
  if (filters.stops.size < 3) {
    [...allStops].filter((s) => !filters.stops.has(s)).forEach((s) => {
      // show which are EXCLUDED as "without X" — actually show which are ACTIVE
    });
    // Show included stops
    [...filters.stops].forEach((s) => {
      const label = s === 0 ? "Nonstop" : s === 1 ? "1 stop" : "2+ stops";
      chips.push({
        label,
        onRemove: () => {
          const next = new Set(filters.stops);
          next.delete(s);
          onChange({ ...filters, stops: next });
        },
      });
    });
  }

  // Airline chips — only when some are unchecked
  if (filters.airlines.size < allAirlines.size && filters.airlines.size > 0) {
    [...filters.airlines].forEach((code) => {
      const name = flights.find((f) => f.airline === code)?.airlineName ?? code;
      chips.push({
        label: name,
        onRemove: () => {
          const next = new Set(filters.airlines);
          next.delete(code);
          onChange({ ...filters, airlines: next });
        },
      });
    });
  }

  if (filters.carryOnOnly)   chips.push({ label: "Carry-on included", onRemove: () => onChange({ ...filters, carryOnOnly: false }) });
  if (filters.checkedBagOnly) chips.push({ label: "Checked bag included", onRemove: () => onChange({ ...filters, checkedBagOnly: false }) });
  if (filters.refundableOnly) chips.push({ label: "Refundable", onRemove: () => onChange({ ...filters, refundableOnly: false }) });
  if (filters.maxPrice < 9999) chips.push({ label: `Up to $${filters.maxPrice}`, onRemove: () => onChange({ ...filters, maxPrice: 9999 }) });
  if (filters.maxDuration < 9999) chips.push({ label: `Under ${Math.floor(filters.maxDuration / 60)}h ${filters.maxDuration % 60}m`, onRemove: () => onChange({ ...filters, maxDuration: 9999 }) });
  [...filters.depTimes].forEach((t) => chips.push({ label: `Departs ${t}`, onRemove: () => { const next = new Set(filters.depTimes); next.delete(t); onChange({ ...filters, depTimes: next }); } }));
  [...filters.arrTimes].forEach((t) => chips.push({ label: `Arrives ${t}`, onRemove: () => { const next = new Set(filters.arrTimes); next.delete(t); onChange({ ...filters, arrTimes: next }); } }));

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      {chips.map((chip) => (
        <motion.button
          key={chip.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={chip.onRemove}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                     border-2 border-[var(--sky-primary)]
                     bg-blue-50 dark:bg-blue-950/40
                     text-[var(--sky-primary)] text-xs font-semibold
                     hover:bg-blue-100 dark:hover:bg-blue-950/60
                     transition-colors"
        >
          {chip.label}
          <X className="w-3 h-3" />
        </motion.button>
      ))}
      <button
        onClick={() => onChange({ ...defaultFilters(), airlines: new Set(flights.map((f) => f.airline)) })}
        className="text-xs text-gray-500 hover:text-[var(--sky-primary)] font-semibold hover:underline ml-1"
      >
        Clear all filters
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { sentinelRef, stuck } = useStickyObserver();

  const sp = {
    origin:      searchParams.get("origin")      ?? "ORD",
    destination: searchParams.get("destination") ?? "ATL",
    dep:         searchParams.get("dep")         ?? format(new Date(), "yyyy-MM-dd"),
    ret:         searchParams.get("ret")         ?? undefined,
    adults:      parseInt(searchParams.get("adults") ?? "1"),
    tripType:    searchParams.get("tripType")    ?? "Roundtrip",
    cabin:       searchParams.get("cabin")       ?? "Economy",
  };

  const originAirport = CURATED_AIRPORTS.find((a) => a.iata === sp.origin) ?? null;
  const destAirport   = CURATED_AIRPORTS.find((a) => a.iata === sp.destination) ?? null;

  const [searchState, setSearchState] = useState<SearchState>({
    tripType:    sp.tripType as SearchState["tripType"],
    origin:      originAirport,
    destination: destAirport,
    dates: {
      start: sp.dep ? parseISO(sp.dep) : null,
      end:   sp.ret ? parseISO(sp.ret) : null,
    },
    travelers: { adults: sp.adults, children: 0, infants: 0, cabin: sp.cabin as SearchState["travelers"]["cabin"] },
  });

  const [allFlights, setAllFlights]     = useState<FlightOffer[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [empty, setEmpty]               = useState(false);
  const [emptyReason, setEmptyReason]   = useState("");
  const [sort, setSort]                 = useState<SortKey>("recommended");
  const [flexPrices, setFlexPrices]     = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState(sp.dep);
  const [filters, setFilters]           = useState<Filters>(defaultFilters());

  // ── Core search ───────────────────────────────────────────────────────────
  const runSearch = useCallback((
    origin: string, destination: string,
    dep: string, ret: string | undefined,
    adults: number, cabin: string, tripType: string,
  ) => {
    setLoading(true);
    setError(null);
    setEmpty(false);
    searchFlights({
      origin, destination,
      departureDate: dep,
      returnDate: tripType === "Roundtrip" ? ret : undefined,
      adults,
      cabinClass: cabin.toUpperCase().replace(" ", "_"),
    })
      .then((res) => {
        if (res.empty) {
          setEmpty(true);
          setEmptyReason(res.emptyReason ?? "");
          setAllFlights([]);
        } else {
          setAllFlights(res.flights);
          setFilters((prev) => ({
            ...prev,
            airlines: new Set(res.flights.map((f) => f.airline)),
          }));
          if (res.flights.length > 0) {
            const realMin = Math.min(...res.flights.map((f: any) => f.price));
            setFlexPrices((prev) => ({ ...prev, [dep]: realMin }));
          }
          // Save to Supabase search history
          saveSearch({
            origin, destination, dep_date: dep,
            ret_date: ret ?? null, trip_type: tripType,
            cabin, adults,
          }).catch(() => {}); // silent fail if not logged in
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    runSearch(sp.origin, sp.destination, selectedDate, sp.ret, sp.adults, sp.cabin, sp.tripType);
  }, [selectedDate]); // eslint-disable-line

  // Flexible dates strip — uses real SerpAPI prices
  useEffect(() => {
    getFlexibleDates(sp.origin, sp.destination, sp.dep, sp.adults)
      .then((res) => setFlexPrices(res.prices))
      .catch(() => {});
  }, []); // eslint-disable-line

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let result = [...allFlights];
    const totalAirlines = new Set(allFlights.map((f) => f.airline)).size;

    if (filters.stops.size > 0 && filters.stops.size < 3)
      result = result.filter((f) => filters.stops.has(Math.min(f.outbound.stops, 2)));
    if (filters.airlines.size > 0 && filters.airlines.size < totalAirlines)
      result = result.filter((f) => filters.airlines.has(f.airline));
    if (filters.maxPrice < 9999)
      result = result.filter((f) => f.price <= filters.maxPrice);
    if (filters.maxDuration < 9999)
      result = result.filter((f) => parseMins(f.outbound.duration) <= filters.maxDuration);
    if (filters.depTimes.size > 0)
      result = result.filter((f) => filters.depTimes.has(timeSlotOf(depHour(f.outbound.departure))));
    if (filters.arrTimes.size > 0)
      result = result.filter((f) => filters.arrTimes.has(timeSlotOf(depHour(f.outbound.arrival))));
    if (filters.carryOnOnly)    result = result.filter((f) => f.carryOn);
    if (filters.checkedBagOnly) result = result.filter((f) => f.checkedBags > 0);
    if (filters.refundableOnly) result = result.filter((f) => f.refundable);

    switch (sort) {
      case "price_asc":     result.sort((a, b) => a.price - b.price); break;
      case "price_desc":    result.sort((a, b) => b.price - a.price); break;
      case "duration_asc":  result.sort((a, b) => parseMins(a.outbound.duration) - parseMins(b.outbound.duration)); break;
      case "duration_desc": result.sort((a, b) => parseMins(b.outbound.duration) - parseMins(a.outbound.duration)); break;
      case "dep_asc":       result.sort((a, b) => a.outbound.departure.localeCompare(b.outbound.departure)); break;
      case "dep_desc":      result.sort((a, b) => b.outbound.departure.localeCompare(a.outbound.departure)); break;
      case "arr_asc":       result.sort((a, b) => a.outbound.arrival.localeCompare(b.outbound.arrival)); break;
      case "arr_desc":      result.sort((a, b) => b.outbound.arrival.localeCompare(a.outbound.arrival)); break;
      default:
        result.sort((a, b) =>
          a.outbound.stops !== b.outbound.stops
            ? a.outbound.stops - b.outbound.stops
            : a.price - b.price
        );
    }
    return result;
  }, [allFlights, filters, sort]);

  const cheapestPrice = allFlights.length ? Math.min(...allFlights.map((f) => f.price)) : 0;
  const maxPriceAll   = allFlights.length ? Math.max(...allFlights.map((f) => f.price)) : 1000;
  const flexDates     = Object.entries(flexPrices).sort(([a], [b]) => a.localeCompare(b));
  const minFlexPrice  = flexDates.length ? Math.min(...flexDates.map(([, p]) => p)) : 0;

  // ── New search handler ────────────────────────────────────────────────────
  const handleNewSearch = useCallback(() => {
    if (!searchState.origin || !searchState.destination) return;
    const dep = searchState.dates.start
      ? format(searchState.dates.start, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");
    const ret = searchState.dates.end && searchState.tripType === "Roundtrip"
      ? format(searchState.dates.end, "yyyy-MM-dd")
      : undefined;

    router.push(`/flights/search?${new URLSearchParams({
      origin:      searchState.origin.iata,
      destination: searchState.destination.iata,
      tripType:    searchState.tripType,
      adults:      String(searchState.travelers.adults),
      cabin:       searchState.travelers.cabin,
      dep,
      ...(ret ? { ret } : {}),
    })}`);

    setSelectedDate(dep);
    setFilters(defaultFilters());
    runSearch(
      searchState.origin.iata,
      searchState.destination.iata,
      dep, ret,
      searchState.travelers.adults,
      searchState.travelers.cabin,
      searchState.tripType,
    );
  }, [searchState, router, runSearch]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F1117]">
      <Navbar />

      {/* Inline search bar */}
      <div className="bg-white dark:bg-[#0F1117] border-b border-gray-200 dark:border-gray-800 py-3">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <SearchBar state={searchState} onChange={setSearchState} onSubmit={handleNewSearch} />
        </div>
      </div>
      <div ref={sentinelRef} className="h-px" />
      <StickySearchBar show={stuck} state={searchState} onChange={setSearchState} onSubmit={handleNewSearch} />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        {/* Header — breadcrumb style like Expedia */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <span>Choose departing flight</span>
            {sp.tripType === "Roundtrip" && (
              <>
                <span>›</span>
                <span>Choose returning flight</span>
                <span>›</span>
                <span>Review your trip</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {sp.tripType === "Roundtrip" ? "Choose departing flight" : "Choose your flight"}{" · "}
            <span className="text-[var(--sky-primary)]">{sp.origin} → {sp.destination}</span>
          </h1>
        </div>

        {/* Flexible dates strip */}
        {flexDates.length > 0 && (
          <div className="flex items-stretch bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-5">
            {flexDates.map(([date, price]) => {
              const isSelected = date === selectedDate;
              const isCheapest = price === minFlexPrice;
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-1 py-3 px-1 text-center border-r last:border-r-0 border-gray-100 dark:border-gray-800 transition-colors ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-950/40 border-b-2 border-b-[var(--sky-primary)]"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {format(parseISO(date), "EEE MMM d")}
                  </p>
                  <p className={`text-sm font-bold mt-0.5 ${
                    isCheapest ? "text-[var(--sky-green)]" : isSelected ? "text-[var(--sky-primary)]" : "text-gray-900 dark:text-white"
                  }`}>
                    ${price}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Disclaimer like Expedia */}
        {allFlights.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Prices may change based on availability and are not final until you complete your purchase.
          </p>
        )}

        {/* Active filter chips */}
        <AnimatePresence>
          <ActiveFilterChips
            flights={allFlights}
            filters={filters}
            onChange={setFilters}
          />
        </AnimatePresence>

        {/* Sort + count bar */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {loading
              ? "Searching for flights…"
              : `${displayed.length} of ${allFlights.length} flights`}
          </p>
          <SortDropdown value={sort} onChange={setSort} />
        </div>

        <div className="flex items-start gap-5">
          {/* Filters sidebar */}
          <div className="hidden lg:block flex-shrink-0">
            <FiltersPanel
              flights={allFlights}
              filters={filters}
              onChange={setFilters}
              cheapestPrice={cheapestPrice}
              maxPrice={maxPriceAll}
            />
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0 space-y-3">
            {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}

            {!loading && error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Search failed</p>
                <p className="text-sm text-gray-500 mb-4">{error}</p>
                <button onClick={handleNewSearch} className="px-6 py-2 bg-[var(--sky-primary)] text-white rounded-full text-sm font-bold">Retry</button>
              </div>
            )}

            {!loading && empty && (
              <div className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
                <div className="text-6xl mb-4">✈️</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No flights found</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">{emptyReason}</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button onClick={handleNewSearch} className="px-6 py-2.5 bg-[var(--sky-primary)] text-white rounded-full text-sm font-bold">Try flexible dates</button>
                  <a href="/chat" className="px-6 py-2.5 border border-[var(--sky-primary)] text-[var(--sky-primary)] rounded-full text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors">Ask SkyRisk AI</a>
                </div>
              </div>
            )}

            {!loading && !empty && displayed.length === 0 && allFlights.length > 0 && (
              <div className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center">
                <p className="text-gray-700 dark:text-gray-300 font-semibold mb-2">No flights match your filters</p>
                <p className="text-sm text-gray-500 mb-3">Try adjusting your filters to see more results</p>
                <button
                  onClick={() => setFilters({ ...defaultFilters(), airlines: new Set(allFlights.map((f) => f.airline)) })}
                  className="text-sm text-[var(--sky-primary)] font-semibold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Staggered animated flight cards */}
            <AnimatePresence mode="popLayout">
              {!loading && !empty && displayed.map((flight, i) => (
                <motion.div
                  key={flight.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.22, delay: Math.min(i * 0.05, 0.4) }}
                >
                  <FlightCard
                    offer={flight}
                    index={i}
                    badge={i === 0 ? "Cheapest" : i === 1 ? "Best" : null}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <ChatBubble />
    </div>
  );
}
