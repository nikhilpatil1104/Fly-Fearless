"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/navbar/Navbar";
import { ArrowRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TripType = "All deals" | "One way" | "Roundtrip";

interface Deal {
  price: number;
  airline: string;
  code: string;
  orig: string;
  origIATA: string;
  dest: string;
  destIATA: string;
  date: string;
  type: "One way" | "Roundtrip";   // ← matches filter values exactly
}

// ─── Airline colour map ───────────────────────────────────────────────────────

const AIRLINE_COLORS: Record<string, string> = {
  DL: "#E01933",
  AA: "#0078D2",
  UA: "#002244",
  WN: "#F9B612",
  B6: "#003876",
  AS: "#01426A",
  NK: "#3D0095",
  F9: "#006F53",
};

// ─── Featured deals ───────────────────────────────────────────────────────────
// NOTE: Mix of "One way" and "Roundtrip" so the filter actually works.

export const FEATURED_DEALS: Deal[] = [
  { price: 99,  airline: "Delta",            code: "DL", orig: "Chicago",       origIATA: "ORD", dest: "Atlanta",    destIATA: "ATL", date: "Sun, May 24, 2026", type: "Roundtrip" },
  { price: 149, airline: "American Airlines", code: "AA", orig: "New York",      origIATA: "JFK", dest: "Los Angeles",destIATA: "LAX", date: "Mon, Jun 2, 2026",  type: "Roundtrip" },
  { price: 129, airline: "United",            code: "UA", orig: "Los Angeles",   origIATA: "LAX", dest: "Miami",     destIATA: "MIA", date: "Fri, May 30, 2026", type: "One way"   },
  { price: 89,  airline: "Southwest",         code: "WN", orig: "Dallas",        origIATA: "DFW", dest: "Denver",    destIATA: "DEN", date: "Tue, Jun 10, 2026", type: "Roundtrip" },
  { price: 179, airline: "JetBlue",           code: "B6", orig: "San Francisco", origIATA: "SFO", dest: "Seattle",   destIATA: "SEA", date: "Wed, Jun 4, 2026",  type: "One way"   },
  { price: 119, airline: "Alaska",            code: "AS", orig: "Boston",        origIATA: "BOS", dest: "Miami",     destIATA: "MIA", date: "Sat, Jun 7, 2026",  type: "Roundtrip" },
  { price: 109, airline: "Spirit",            code: "NK", orig: "Seattle",       origIATA: "SEA", dest: "Las Vegas", destIATA: "LAS", date: "Thu, Jun 12, 2026", type: "One way"   },
  { price: 139, airline: "Frontier",          code: "F9", orig: "Denver",        origIATA: "DEN", dest: "Phoenix",   destIATA: "PHX", date: "Sun, Jun 14, 2026", type: "Roundtrip" },
  { price: 99,  airline: "Delta",             code: "DL", orig: "Atlanta",       origIATA: "ATL", dest: "Orlando",   destIATA: "MCO", date: "Fri, Jun 5, 2026",  type: "One way"   },
  { price: 159, airline: "United",            code: "UA", orig: "Chicago",       origIATA: "ORD", dest: "New York",  destIATA: "LGA", date: "Mon, Jun 8, 2026",  type: "Roundtrip" },
];

// ─── FAQ template ─────────────────────────────────────────────────────────────

const FAQ_TEMPLATE = (
  origCity: string,
  destCity: string,
  airline: string,
  price: number
) => [
  { q: `How far in advance should I book a flight from ${origCity} to ${destCity}?`, a: `For domestic routes like ${origCity} to ${destCity}, booking 3–8 weeks in advance tends to offer the best prices. Last-minute deals can appear within 2 weeks but are unpredictable.` },
  { q: `What is the cheapest month to fly from ${origCity} to ${destCity}?`, a: `January and February are typically the cheapest months. Avoid holiday weekends and summer peak season if you're price-sensitive.` },
  { q: `Does ${airline} charge for carry-on bags?`, a: `${airline} allows one personal item free. Carry-on bag policies vary by fare class — Basic Economy on most carriers charges extra for overhead bin space.` },
  { q: `How long is the flight from ${origCity} to ${destCity}?`, a: `Direct flights typically range from 1.5 to 4 hours depending on the exact route. Connecting itineraries can take 4–8 hours depending on layover.` },
  { q: `Which day of the week has the cheapest flights?`, a: `Tuesday and Wednesday departures are typically 15–20% cheaper than Friday or Sunday for most US routes.` },
];

// ─── CURATED_AIRPORTS subset ──────────────────────────────────────────────────

const AIRPORT_CITY: Record<string, string> = {
  ORD: "Chicago", JFK: "New York", LAX: "Los Angeles", MIA: "Miami",
  DFW: "Dallas", DEN: "Denver", SFO: "San Francisco", SEA: "Seattle",
  BOS: "Boston", LAS: "Las Vegas", PHX: "Phoenix", ATL: "Atlanta",
  MCO: "Orlando", LGA: "New York",
};

// ─── Inner component (uses useSearchParams — must be inside Suspense) ─────────

function DealsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const origin      = searchParams.get("origin")      ?? "ORD";
  const destination = searchParams.get("destination") ?? "ATL";

  const originCity = AIRPORT_CITY[origin] ?? origin;
  const destCity   = AIRPORT_CITY[destination] ?? destination;

  // Find the first matching deal for the heading
  const currentDeal =
    FEATURED_DEALS.find((d) => d.origIATA === origin && d.destIATA === destination)
    ?? FEATURED_DEALS[0];

  // ── Filter state — default to "All deals" so all cards are visible immediately
  const [filter, setFilter] = useState<TripType>("All deals");
  const [openFaq, setOpenFaq]       = useState<number | null>(null);

  const faq = FAQ_TEMPLATE(originCity, destCity, currentDeal.airline, currentDeal.price);

  // ── Apply filter
  const visibleDeals = FEATURED_DEALS.filter((d) => {
    if (filter === "All deals") return true;
    return d.type === filter;   // "One way" | "Roundtrip" match exactly
  });

  // ── Alt airports (static for now)
  const ALT_AIRPORTS = [
    { iata: "BHM", name: "Birmingham-Shuttlesworth", label: "Cheapest", drive: "2h 40m", price: currentDeal.price - 49 },
    { iata: "CHA", name: "Chattanooga Metro.",         label: "Average",  drive: "1h 50m", price: currentDeal.price - 8  },
    { iata: "HSV", name: "Huntsville Intl.",           label: "Average",  drive: "3h 20m", price: currentDeal.price + 10 },
  ];

  return (
    <div className="min-h-screen bg-[var(--sky-bg)]">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-10">

        {/* ── Heading ──────────────────────────────────────────────── */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          ${currentDeal.price} Cheap {currentDeal.airline} flights{" "}
          {originCity} ({origin}) to {destCity} ({destination})
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-4xl text-sm">
          Prices were available within the past 7 days and start at ${currentDeal.price} for one-way flights
          and ${currentDeal.price * 2 - 3} for round trip. Prices and availability are subject to change.
          Additional terms apply.
        </p>

        {/* ── Filter pills ─────────────────────────────────────────── */}
          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              className="px-4 py-1.5 rounded-full text-sm font-medium border bg-blue-50 dark:bg-blue-950/40 border-[var(--sky-primary)] text-[var(--sky-primary)]"
            >
              All deals
            </button>
          </div>

        {/* ── Deal cards ────────────────────────────────────────────── */}
        {visibleDeals.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 py-10 text-sm">
            No {filter.toLowerCase()} deals available for this route.
          </div>
        ) : (
          <div className="space-y-3 mb-12">
            {visibleDeals.map((deal, i) => (
              <div
                key={`${deal.origIATA}-${deal.destIATA}-${i}`}
                onClick={() =>
                  router.push(
                    `/flights/search?origin=${deal.origIATA}&destination=${deal.destIATA}&tripType=${encodeURIComponent(deal.type)}&adults=1&cabin=Economy`
                  )
                }
                className="flex items-center gap-6 bg-white dark:bg-[#1C1F26]
                           border border-gray-200 dark:border-gray-800 rounded-2xl p-5
                           hover:shadow-lg hover:border-[var(--sky-primary)]
                           transition-all duration-200 cursor-pointer max-w-2xl"
              >
                {/* Airline badge */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                  style={{ backgroundColor: AIRLINE_COLORS[deal.code] ?? "#555" }}
                >
                  {deal.code}
                </div>

                {/* Route */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                    <span>{deal.orig}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{deal.dest}</span>
                    <span className="ml-2 text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400">
                      {deal.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {deal.airline} · {deal.date}
                  </div>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-[var(--sky-primary)]">${deal.price}</div>
                  <div className="text-[10px] text-gray-400">per person</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Alt airports ─────────────────────────────────────────── */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Consider nearby airports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {ALT_AIRPORTS.map((a) => (
            <div
              key={a.iata}
              className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[var(--sky-primary)]">{a.iata}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    a.label === "Cheapest"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {a.label}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{a.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.drive} drive</div>
              <div className="text-base font-bold text-gray-900 dark:text-white mt-2">${a.price}</div>
            </div>
          ))}
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Frequently asked questions
        </h2>
        <div className="space-y-2 mb-16 max-w-3xl">
          {faq.map((item, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.q}</span>
                <span className="text-gray-400 flex-shrink-0 text-lg">{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-400">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Default export — Suspense boundary fixes useSearchParams hydration ───────
// Without this, Next.js renders the page in a degraded static shell where
// React event handlers (onClick) never attach after hydration.

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--sky-bg)]"><Navbar /></div>}>
      <DealsContent />
    </Suspense>
  );
}
