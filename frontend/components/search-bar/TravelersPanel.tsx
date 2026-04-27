"use client";

import { useEffect, useRef, useState } from "react";
import { Users, ChevronDown } from "lucide-react";
import type { TravelerCounts, CabinClass } from "@/lib/types";

const CABIN_CLASSES: CabinClass[] = ["Economy", "Premium Economy", "Business", "First class"];

interface Props {
  value: TravelerCounts;
  onChange: (value: TravelerCounts) => void;
}

export default function TravelersPanel({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const total = value.adults + value.children + value.infants;

  const adjust = (field: keyof Omit<TravelerCounts, "cabin">, delta: number) => {
    const min = field === "adults" ? 1 : 0;
    const max = field === "infants" ? value.adults : 9;
    onChange({ ...value, [field]: Math.max(min, Math.min(max, value[field] + delta)) });
  };

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 px-3 pt-2 uppercase tracking-wide">
        Travelers, Cabin class
      </label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 pb-2 text-left"
      >
        <Users className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-900 dark:text-white flex-1 truncate">
          {total} traveler{total !== 1 ? "s" : ""}, {value.cabin}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full z-[500] right-0 mt-2 z-50
                        bg-white dark:bg-[#1C1F26]
                        rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700
                        p-5 w-72">
          {/* Counter rows */}
          {(
            [
              { key: "adults", label: "Adults", sub: "18+" },
              { key: "children", label: "Children", sub: "2–17" },
              { key: "infants", label: "Infants", sub: "Under 2 (on lap)" },
            ] as const
          ).map((row) => (
            <div key={row.key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.label}</p>
                <p className="text-xs text-gray-500">{row.sub}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => adjust(row.key, -1)}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600
                             hover:border-[var(--sky-primary)] hover:text-[var(--sky-primary)]
                             text-gray-700 dark:text-gray-300 font-bold text-lg leading-none
                             flex items-center justify-center transition-colors disabled:opacity-30"
                  disabled={value[row.key] <= (row.key === "adults" ? 1 : 0)}
                >
                  −
                </button>
                <span className="w-5 text-center text-sm font-bold text-gray-900 dark:text-white">
                  {value[row.key]}
                </span>
                <button
                  onClick={() => adjust(row.key, 1)}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600
                             hover:border-[var(--sky-primary)] hover:text-[var(--sky-primary)]
                             text-gray-700 dark:text-gray-300 font-bold text-lg leading-none
                             flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          ))}

          {/* Cabin class */}
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Cabin class
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CABIN_CLASSES.map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ ...value, cabin: c })}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    value.cabin === c
                      ? "bg-[var(--sky-primary)] text-white border-[var(--sky-primary)]"
                      : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[var(--sky-primary)] hover:text-[var(--sky-primary)]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="mt-4 w-full py-2.5 bg-[var(--sky-primary)] hover:bg-[var(--sky-primary-hover)]
                       text-white text-sm font-bold rounded-full transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
