"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FeaturedDeal, FlightOffer } from "./types";

export const FEATURED_DEALS: FeaturedDeal[] = [
  { price: 99, airline: "Delta", code: "DL", orig: "Chicago", origIATA: "ORD", dest: "Atlanta", destIATA: "ATL", date: "Sun, May 24, 2026", type: "Roundtrip" },
  { price: 149, airline: "American Airlines", code: "AA", orig: "New York", origIATA: "JFK", dest: "Los Angeles", destIATA: "LAX", date: "Mon, Jun 2, 2026", type: "Roundtrip" },
  { price: 129, airline: "United", code: "UA", orig: "Los Angeles", origIATA: "LAX", dest: "Miami", destIATA: "MIA", date: "Fri, May 30, 2026", type: "Roundtrip" },
  { price: 89, airline: "Southwest", code: "WN", orig: "Dallas", origIATA: "DFW", dest: "Denver", destIATA: "DEN", date: "Tue, Jun 10, 2026", type: "Roundtrip" },
  { price: 179, airline: "JetBlue", code: "B6", orig: "San Francisco", origIATA: "SFO", dest: "Seattle", destIATA: "SEA", date: "Wed, Jun 4, 2026", type: "Roundtrip" },
  { price: 119, airline: "Alaska", code: "AS", orig: "Boston", origIATA: "BOS", dest: "Miami", destIATA: "MIA", date: "Sat, Jun 7, 2026", type: "Roundtrip" },
  { price: 109, airline: "Spirit", code: "NK", orig: "Seattle", origIATA: "SEA", dest: "Las Vegas", destIATA: "LAS", date: "Thu, Jun 12, 2026", type: "Roundtrip" },
  { price: 139, airline: "Frontier", code: "F9", orig: "Denver", origIATA: "DEN", dest: "Phoenix", destIATA: "PHX", date: "Sun, Jun 14, 2026", type: "Roundtrip" },
  { price: 99, airline: "Delta", code: "DL", orig: "Atlanta", origIATA: "ATL", dest: "Orlando", destIATA: "MCO", date: "Fri, Jun 5, 2026", type: "Roundtrip" },
  { price: 159, airline: "United", code: "UA", orig: "Chicago", origIATA: "ORD", dest: "New York", destIATA: "LGA", date: "Mon, Jun 8, 2026", type: "Roundtrip" },
];

const ROTATION_INTERVAL_MS = 8000;

export interface DealHeadingState {
  deal: FeaturedDeal;
  fadeKey: number;
  isLive: boolean;
  pause: () => void;
  resume: () => void;
  updateFromSearchResults: (flights: FlightOffer[], origin: string, destination: string) => void;
}

export function useDealHeading(): DealHeadingState {
  const [index, setIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const [liveDeal, setLiveDeal] = useState<FeaturedDeal | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const bump = useCallback(() => {
    setIndex((i) => (i + 1) % FEATURED_DEALS.length);
    setFadeKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (paused || liveDeal) return;
    intervalRef.current = setInterval(bump, ROTATION_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, liveDeal, bump]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => {
    setPaused(false);
    setLiveDeal(null);
  }, []);

  const updateFromSearchResults = useCallback(
    (flights: FlightOffer[], origin: string, destination: string) => {
      if (!flights.length) return;
      const cheapest = [...flights].sort((a, b) => a.price - b.price)[0];
      const dep = cheapest.outbound.departure;
      const depDate = dep
        ? new Date(dep).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
        : "upcoming";

      setLiveDeal({
        price: cheapest.price,
        airline: cheapest.airline,
        code: cheapest.airline,
        orig: origin,
        origIATA: cheapest.outbound.origin,
        dest: destination,
        destIATA: cheapest.outbound.destination,
        date: depDate,
        type: cheapest.inbound ? "Roundtrip" : "One-way",
      });
      setFadeKey((k) => k + 1);
      setPaused(true);
    },
    []
  );

  return {
    deal: liveDeal ?? FEATURED_DEALS[index],
    fadeKey,
    isLive: !!liveDeal,
    pause,
    resume,
    updateFromSearchResults,
  };
}
