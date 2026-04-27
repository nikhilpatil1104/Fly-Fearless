"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, startOfMonth, getDaysInMonth, getDay, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import { getCalendarPrices } from "@/lib/api";
import type { DateRange } from "@/lib/types";

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
  origin?: string | null;
  destination?: string | null;
  tripType?: string;
}

type PriceMap = Record<string, number | "loading" | null>;

function PriceLabel({ price, isSelected }: { price: number | "loading" | null; isSelected: boolean }) {
  if (price === "loading") {
    return <span className="block w-8 h-2 rounded shimmer mx-auto mt-0.5" />;
  }
  if (!price) return null;

  return (
    <span
      className={`block text-[9px] font-semibold mt-0.5 ${isSelected ? "text-blue-100" : ""}`}
    >
      ${price}
    </span>
  );
}

function MonthGrid({
  month,
  prices,
  selection,
  onDayClick,
  hoverDate,
  onHover,
}: {
  month: Date;
  prices: PriceMap;
  selection: DateRange;
  onDayClick: (d: Date) => void;
  hoverDate: Date | null;
  onHover: (d: Date | null) => void;
}) {
  const firstDay = startOfMonth(month);
  const startDow = getDay(firstDay);
  const totalDays = getDaysInMonth(month);

  // Price range for colour coding
  const numericPrices = Object.values(prices).filter((p) => typeof p === "number") as number[];
  const minP = numericPrices.length ? Math.min(...numericPrices) : 0;
  const maxP = numericPrices.length ? Math.max(...numericPrices) : 0;
  const range = maxP - minP || 1;

  const priceColor = (p: number | "loading" | null) => {
    if (!p || p === "loading") return "text-gray-400 dark:text-gray-600";
    const ratio = (p - minP) / range;
    if (ratio <= 0.33) return "text-[var(--sky-green)]";
    if (ratio <= 0.66) return "text-gray-700 dark:text-gray-300";
    return "text-gray-400 dark:text-gray-500";
  };

  const cells: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];

  return (
    <div className="flex-1 min-w-[260px]">
      <h3 className="text-center font-semibold text-sm text-gray-900 dark:text-white mb-3">
        {format(month, "MMMM yyyy")}
      </h3>
      <div className="grid grid-cols-7 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />;
          const key = format(date, "yyyy-MM-dd");
          const price = prices[key] ?? null;
          const isStart = selection.start && isSameDay(date, selection.start);
          const isEnd = selection.end && isSameDay(date, selection.end);
          const inRange =
            selection.start &&
            (selection.end || hoverDate) &&
            isAfter(date, selection.start) &&
            isBefore(date, (selection.end || hoverDate)!);
          const isPast = isBefore(date, startOfDay(new Date()));

          return (
            <button
              key={key}
              disabled={isPast}
              onClick={() => onDayClick(date)}
              onMouseEnter={() => onHover(date)}
              onMouseLeave={() => onHover(null)}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center
                text-[11px] leading-tight transition-all duration-100
                ${isPast ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
                ${isStart || isEnd
                  ? "bg-[var(--sky-primary)] text-white shadow-md"
                  : inRange
                  ? "bg-blue-100 dark:bg-blue-900/40"
                  : !isPast
                  ? "hover:bg-gray-100 dark:hover:bg-gray-800"
                  : ""}
              `}
            >
              <span className={`font-semibold ${isStart || isEnd ? "text-white" : "text-gray-900 dark:text-white"}`}>
                {date.getDate()}
              </span>
              {!isStart && !isEnd ? (
                <span className={`text-[9px] font-medium ${priceColor(price)}`}>
                  {price === "loading" ? (
                    <span className="block w-7 h-1.5 rounded shimmer" />
                  ) : price ? (
                    `$${price}`
                  ) : null}
                </span>
              ) : (
                <PriceLabel price={price} isSelected={true} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DatePicker({ value, onChange, origin, destination, tripType = "Roundtrip" }: Props) {
  const [open, setOpen] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [prices, setPrices] = useState<PriceMap>({});
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const today = new Date();
  const m1 = addMonths(startOfMonth(today), monthOffset);
  const m2 = addMonths(m1, 1);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Fetch prices when origin + destination available
  const fetchPrices = useCallback(
    async (month: Date) => {
      if (!origin || !destination) return;
      const key = format(month, "yyyy-MM");
      // Mark all days in month as loading
      const year = month.getFullYear();
      const mon = month.getMonth();
      const days = getDaysInMonth(month);
      const loadingEntries = Object.fromEntries(
        Array.from({ length: days }, (_, i) => [
          format(new Date(year, mon, i + 1), "yyyy-MM-dd"),
          "loading" as const,
        ])
      );
      setPrices((prev) => ({ ...prev, ...loadingEntries }));
      try {
        const data = await getCalendarPrices(
          origin,
          destination,
          month.getFullYear(),
          month.getMonth() + 1,
          tripType === "Roundtrip" ? "roundtrip" : "oneWay"
        );
        setPrices((prev) => ({ ...prev, ...data.prices }));
      } catch {
        // Clear loading state silently
        setPrices((prev) => {
          const updated = { ...prev };
          Object.keys(loadingEntries).forEach((k) => { if (updated[k] === "loading") delete updated[k]; });
          return updated;
        });
      }
    },
    [origin, destination, tripType]
  );

  useEffect(() => {
    if (open && origin && destination) {
      fetchPrices(m1);
      fetchPrices(m2);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, origin, destination, monthOffset]);

  const handleDayClick = (date: Date) => {
    if (tripType !== "Roundtrip") {
      // One-way: single date only, close immediately
      onChange({ start: date, end: null });
      setTimeout(() => setOpen(false), 150);
      return;
    }
    // Roundtrip: select range
    if (!value.start || (value.start && value.end)) {
      onChange({ start: date, end: null });
    } else if (isAfter(date, value.start)) {
      onChange({ start: value.start, end: date });
      setTimeout(() => setOpen(false), 250);
    } else {
      onChange({ start: date, end: null });
    }
  };

  const isRoundtrip = tripType === "Roundtrip";
  const label =
    value.start && value.end
      ? `${format(value.start, "MMM d")} – ${format(value.end, "MMM d")}`
      : value.start && isRoundtrip
      ? `${format(value.start, "MMM d")} – Return`
      : value.start
      ? format(value.start, "MMM d, yyyy")
      : isRoundtrip ? "Departure – Return" : "Select date";

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 px-3 pt-2 uppercase tracking-wide">
        Dates
      </label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 pb-2 text-left"
      >
        <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        <span className="text-sm font-bold text-black dark:text-white truncate">{label}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-[500]
                        bg-white dark:bg-[#1C1F26]
                        rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700
                        p-5 w-[640px] max-w-[calc(100vw-2rem)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMonthOffset((o) => Math.max(0, o - 1))}
              disabled={monthOffset === 0}
              className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800
                         flex items-center justify-center disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {!origin || !destination ? (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full">
                Select airports to see prices
              </span>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Prices shown are lowest available per day
              </span>
            )}
            <button
              onClick={() => setMonthOffset((o) => o + 1)}
              className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Two-month grid */}
          <div className="flex gap-8">
            <MonthGrid
              month={m1}
              prices={prices}
              selection={value}
              onDayClick={handleDayClick}
              hoverDate={hoverDate}
              onHover={setHoverDate}
            />
            <div className="w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <MonthGrid
              month={m2}
              prices={prices}
              selection={value}
              onDayClick={handleDayClick}
              hoverDate={hoverDate}
              onHover={setHoverDate}
            />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--sky-green)]" /> Cheapest
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-500" /> Average
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" /> Expensive
            </span>
            <button
              onClick={() => onChange({ start: null, end: null })}
              className="ml-auto text-[var(--sky-primary)] hover:underline font-medium"
            >
              Clear dates
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
