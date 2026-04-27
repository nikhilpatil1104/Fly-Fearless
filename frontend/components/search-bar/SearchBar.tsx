"use client";

import { ArrowLeftRight, Search } from "lucide-react";
import AirportInput from "./AirportInput";
import DatePicker from "./DatePicker";
import TravelersPanel from "./TravelersPanel";
import type { SearchState } from "@/lib/types";
import { cn } from "@/lib/hooks";

interface Props {
  state: SearchState;
  onChange: (state: SearchState) => void;
  onSubmit: () => void;
  compact?: boolean;
}

export default function SearchBar({ state, onChange, onSubmit, compact = false }: Props) {
  const swap = () =>
    onChange({ ...state, origin: state.destination, destination: state.origin });

  return (
    <div className={cn(
      "bg-white dark:bg-[#1C1F26] rounded-2xl transition-all duration-300",
      compact ? "shadow-lg px-3 py-2" : "shadow-2xl px-5 py-4"
    )}>
      {/* Trip type tabs */}
      <div className={cn("flex items-center gap-6 px-1", compact ? "mb-2" : "mb-4")}>
        {(["Roundtrip", "One-way", "Multi-city"] as const).map((t) => (
          <button
            key={t}
            onClick={() => onChange({ ...state, tripType: t })}
            className={cn(
              "pb-1.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap",
              state.tripType === t
                ? "border-[var(--sky-primary)] text-[var(--sky-primary)]"
                : "border-transparent text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main row — airports get more space (flex-[1.6]) than dates+travelers (flex-1) */}
      <div className="flex items-stretch gap-2">

        {/* Origin + Destination — wider */}
        <div className="flex flex-[1.6] items-stretch relative bg-white dark:bg-[#1C1F26] border border-gray-300 dark:border-gray-700 rounded-xl overflow-visible">
          <AirportInput
            id="origin-input"
            label="Leaving from"
            value={state.origin}
            onChange={(a) => onChange({ ...state, origin: a ?? null })}
            placeholder="City or airport"
          />
          <button
            onClick={swap}
            aria-label="Swap airports"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                       w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600
                       bg-white dark:bg-[#1C1F26]
                       hover:border-[var(--sky-primary)] hover:text-[var(--sky-primary)]
                       text-gray-600 dark:text-gray-400
                       flex items-center justify-center shadow-sm transition-all"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
          <div className="w-px bg-gray-200 dark:bg-gray-700 my-2" />
          <AirportInput
            id="destination-input"
            label="Going to"
            value={state.destination}
            onChange={(a) => onChange({ ...state, destination: a ?? null })}
            placeholder="City or airport"
          />
        </div>

        {/* Dates + Travelers */}
        <div className="flex flex-1 items-stretch bg-white dark:bg-[#1C1F26] border border-gray-300 dark:border-gray-700 rounded-xl overflow-visible">
          <DatePicker
            value={state.dates}
            onChange={(d) => onChange({ ...state, dates: d })}
            origin={state.origin?.iata ?? null}
            destination={state.destination?.iata ?? null}
            tripType={state.tripType}
          />
          <div className="w-px bg-gray-200 dark:bg-gray-700 my-2" />
          <TravelersPanel
            value={state.travelers}
            onChange={(t) => onChange({ ...state, travelers: t })}
          />
        </div>

        {/* Search button */}
        <button
          onClick={onSubmit}
          className="px-8 bg-[var(--sky-primary)] hover:bg-[var(--sky-primary-hover)]
                     text-white font-bold text-sm rounded-full
                     flex items-center gap-2 flex-shrink-0
                     transition-colors shadow-md hover:shadow-lg"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>
    </div>
  );
}
