"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Bell, Gift, Sparkles, ArrowLeftRight, Clock, ChevronDown, ChevronUp, Heart } from "lucide-react";
import Navbar from "@/components/navbar/Navbar";
import HeroSection from "@/components/hero/HeroSection";
import SearchBar from "@/components/search-bar/SearchBar";
import ChatBubble from "@/components/chat-bubble/ChatBubble";
import { useDealHeading, FEATURED_DEALS } from "@/lib/deals";
import { searchFlights } from "@/lib/api";
import type { FlightOffer } from "@/lib/types";
import type { SearchState } from "@/lib/types";

const FAQ = [
  { q: "How much is a Delta flight from Chicago to Atlanta?", a: "Prices start at $99 one-way and $197 roundtrip based on recent searches. Prices change based on date, demand, and availability." },
  { q: "What is the cheapest month to fly from Chicago to Atlanta?", a: "February and September tend to offer the lowest fares on this route, with prices frequently dipping below the annual average." },
  { q: "Does Delta fly nonstop from Chicago to Atlanta?", a: "Yes. Delta operates multiple nonstop flights daily between ORD and ATL, with the shortest scheduled flight time around 1h 54m." },
  { q: "How long does it take to fly from Chicago to Atlanta?", a: "Nonstop flights average around 2 hours. With a connection, total travel time ranges from 4–7 hours depending on the layover." },
  { q: "Which day of the week has the most flights?", a: "Tuesday and Wednesday typically have the highest flight volume on this route, with over 40 daily departures combined." },
];

const ALT_AIRPORTS = [
  { iata: "BHM", name: "Birmingham-Shuttlesworth Intl.", label: "Cheapest", drive: "2h 40m", price: 148 },
  { iata: "CHA", name: "Chattanooga Metro.", label: "Average", drive: "1h 50m", price: 189 },
  { iata: "HSV", name: "Huntsville Intl.", label: "Average", drive: "3h 20m", price: 207 },
];

export default function HomePage() {
  const router = useRouter();
  const heading = useDealHeading();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [search, setSearch] = useState<SearchState>({
    tripType: "Roundtrip",
    origin: null,
    destination: null,
    dates: { start: null, end: null },
    travelers: { adults: 1, children: 0, infants: 0, cabin: "Economy" },
  });

  const [liveFlights, setLiveFlights] = useState<FlightOffer[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dealsSearched, setDealsSearched] = useState<{origin: string, dest: string} | null>(null);

  // Fetch live deals when both airports are selected
  useEffect(() => {
    if (!search.origin || !search.destination) {
      setLiveFlights([]);
      setDealsSearched(null);
      return;
    }
    const key = `${search.origin.iata}-${search.destination.iata}`;
    if (dealsSearched?.origin === search.origin.iata && dealsSearched?.dest === search.destination.iata) return;

    setDealsLoading(true);
    const dep = format(new Date(Date.now() + 86400000 * 14), "yyyy-MM-dd"); // 2 weeks out
    searchFlights({
      origin: search.origin.iata,
      destination: search.destination.iata,
      departureDate: dep,
      adults: 1,
      cabinClass: "ECONOMY",
    })
      .then((res) => {
        if (!res.empty && res.flights.length > 0) {
          setLiveFlights(res.flights.slice(0, 6));
          setDealsSearched({ origin: search.origin!.iata, dest: search.destination!.iata });
          // Update the heading banner with the cheapest real flight
          heading.updateFromSearchResults(res.flights, search.origin!.iata, search.destination!.iata);
        }
      })
      .catch(() => {})
      .finally(() => setDealsLoading(false));
  }, [search.origin?.iata, search.destination?.iata]); // eslint-disable-line

  const handleSearch = useCallback(() => {
    if (!search.origin) {
      document.getElementById("origin-input")?.focus();
      return;
    }
    if (!search.destination) {
      document.getElementById("destination-input")?.focus();
      return;
    }
    const dep = search.dates.start ? format(search.dates.start, "yyyy-MM-dd") : format(new Date(Date.now() + 86400000 * 7), "yyyy-MM-dd");
    const params = new URLSearchParams({
      origin: search.origin.iata,
      destination: search.destination.iata,
      tripType: search.tripType,
      adults: String(search.travelers.adults),
      cabin: search.travelers.cabin,
      dep,
      ...(search.dates.end && search.tripType === "Roundtrip" ? { ret: format(search.dates.end, "yyyy-MM-dd") } : {}),
    });
    heading.pause();
    router.push(`/flights/search?${params}`);
  }, [search, router, heading]);

  return (
    <div className="min-h-screen bg-[var(--sky-bg)]">
      <Navbar />

      {/* Hero — heading + search bar together centered inside the image */}
      <HeroSection heading={heading}>
        <SearchBar state={search} onChange={setSearch} onSubmit={handleSearch} />
      </HeroSection>


      {/* ── Featured Deals ──────────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {search.origin && search.destination
            ? `Flights from ${search.origin.city} (${search.origin.iata}) to ${search.destination.city} (${search.destination.iata})`
            : `$${heading.deal.price} Cheap ${heading.deal.airline} flights ${heading.deal.orig} to ${heading.deal.dest}`
          }
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-4xl">
          {search.origin && search.destination
            ? `Showing deals from ${search.origin.city} to ${search.destination.city}. Prices were available within the past 7 days and are subject to change.`
            : `Prices were available within the past 7 days and start at $${heading.deal.price} for one-way flights. Prices and availability are subject to change.`
          }
        </p>



        {/* Loading skeleton */}
        {dealsLoading && (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="h-20 bg-white dark:bg-[#1C1F26] rounded-2xl animate-pulse border border-gray-200 dark:border-gray-800" />
            ))}
          </div>
        )}

        {/* Live flight results when user has selected airports */}
        {!dealsLoading && liveFlights.length > 0 && (
          <div className="space-y-3">
            {liveFlights.map((flight, i) => {
              const dep = flight.outbound.departure ? new Date(flight.outbound.departure) : null;
              const depStr = dep ? dep.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric", year:"numeric" }) : "";
              const airlineColors: Record<string,string> = { DL:"#E01933", AA:"#0078D2", UA:"#002244", WN:"#F9B612", B6:"#003876", AS:"#01426A", NK:"#3D0095", F9:"#006F53" };
              const bg = airlineColors[flight.airline] ?? "#374151";
              return (
                <div
                  key={flight.id}
                  onClick={() => {
                    const params = new URLSearchParams({
                      origin: flight.outbound.origin,
                      destination: flight.outbound.destination,
                      tripType: search.tripType,
                      adults: "1", cabin: "Economy",
                      dep: flight.outbound.departure?.split("T")[0] ?? "",
                    });
                    router.push(`/flights/search?${params}`);
                  }}
                  className="flex items-center gap-6 bg-white dark:bg-[#1C1F26]
                             border border-gray-200 dark:border-gray-800
                             rounded-2xl p-5 hover:shadow-lg hover:border-[var(--sky-primary)]
                             transition-all duration-200 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0 shadow-sm"
                       style={{ backgroundColor: bg }}>
                    {flight.airline}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--sky-primary)] font-semibold text-sm mb-1">{depStr}</p>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{flight.outbound.origin}</p>
                        <p className="text-xs text-gray-500">{search.origin?.city}</p>
                      </div>
                      <ArrowLeftRight className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{flight.outbound.destination}</p>
                        <p className="text-xs text-gray-500">{search.destination?.city}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{flight.outbound.stopsLabel} · {flight.outbound.duration} · {flight.airlineName ?? flight.airline}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">${Math.round(flight.price)}</p>
                    <p className="text-xs text-gray-500">{search.tripType}</p>
                    <p className="text-[10px] text-[var(--sky-green)] font-semibold mt-0.5">live price</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Static deals when no user search */}
        {!dealsLoading && liveFlights.length === 0 && (
        <div className="space-y-3">
          {FEATURED_DEALS.slice(0, 6).map((deal, i) => (
            <div
              key={i}
              onClick={() => {
                const params = new URLSearchParams({
                  origin: deal.origIATA,
                  destination: deal.destIATA,
                  tripType: deal.type,
                  adults: "1",
                  cabin: "Economy",
                });
                router.push(`/flights/search?${params}`);
              }}
              className="flex items-center gap-6 bg-white dark:bg-[#1C1F26]
                         border border-gray-200 dark:border-gray-800
                         rounded-2xl p-5
                         hover:shadow-lg hover:border-[var(--sky-primary)]
                         transition-all duration-200 cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0 shadow-sm"
                style={{ backgroundColor: { DL: "#E01933", AA: "#0078D2", UA: "#002244", WN: "#F9B612", B6: "#003876", AS: "#01426A", NK: "#3D0095", F9: "#006F53" }[deal.code] ?? "#374151" }}
              >
                {deal.code}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--sky-primary)] font-semibold text-sm mb-1">{deal.date}</p>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{deal.origIATA}</p>
                    <p className="text-xs text-gray-500">{deal.orig}</p>
                  </div>
                  <ArrowLeftRight className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{deal.destIATA}</p>
                    <p className="text-xs text-gray-500">{deal.dest}</p>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">${deal.price}</p>
                <p className="text-xs text-gray-500">{deal.type}</p>
                <p className="text-[10px] text-[var(--sky-green)] font-semibold mt-0.5">just found</p>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>

      {/* ── Alternative airports ─────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Alternative airports near {heading.deal.dest}
        </h3>
        <p className="text-sm text-gray-500 mb-5">Prices available within the past 7 days. Subject to change.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ALT_AIRPORTS.map((a) => (
            <div key={a.iata} className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:shadow-md hover:border-[var(--sky-primary)] transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{a.iata}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${a.label === "Cheapest" ? "bg-green-100 dark:bg-green-900/40 text-[var(--sky-green)]" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                  {a.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{a.name}</p>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                <Clock className="w-3.5 h-3.5" /> {a.drive} drive
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-400">from</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${a.price}</p>
                </div>
                <button className="text-xs font-semibold text-[var(--sky-primary)] hover:underline">View flights →</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Be in the know ───────────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">Be in the know</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <Bell className="w-5 h-5" />, text: "Get alerts if flight prices drop or rise", bg: "bg-blue-50 dark:bg-blue-950/30", clr: "text-[var(--sky-primary)]" },
            { icon: <Gift className="w-5 h-5" />, text: "Save up to 30% on select hotels after you book a flight", bg: "bg-amber-50 dark:bg-amber-950/30", clr: "text-amber-600 dark:text-amber-400" },
            { icon: <Sparkles className="w-5 h-5" />, text: "Earn airline miles on top of our OneKeyCash", bg: "bg-emerald-50 dark:bg-emerald-950/30", clr: "text-[var(--sky-green)]" },
          ].map((c, i) => (
            <div key={i} className={`${c.bg} rounded-2xl p-5 flex items-start gap-4`}>
              <div className={`${c.clr} w-10 h-10 rounded-full bg-white dark:bg-[#1C1F26] flex items-center justify-center flex-shrink-0 shadow-sm`}>
                {c.icon}
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-6 py-10">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">Frequently asked questions</h3>
        <div className="border-t border-gray-200 dark:border-gray-800">
          {FAQ.map((item, i) => (
            <div key={i} className="border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-4 text-left gap-4"
              >
                <span className="font-semibold text-gray-900 dark:text-white">{item.q}</span>
                {openFaq === i
                  ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-[var(--sky-footer)] text-gray-300 py-12 mt-8">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-[#FFC107] rounded-sm flex items-center justify-center">
                <span className="text-gray-900 font-black text-xs">✈</span>
              </div>
              <span className="font-bold text-white text-lg">SkyRisk</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Built with Next.js 14 · FastAPI · SerpAPI Google Flights · OpenAI GPT-4o
            </p>
          </div>
          {["Company", "Explore", "Policies", "Help"].map((s) => (
            <div key={s}>
              <p className="font-semibold text-white mb-3">{s}</p>
              <ul className="space-y-2 text-gray-400">
                {["About", "Careers", "Press", "Contact"].map((i) => (
                  <li key={i} className="hover:text-white cursor-pointer transition-colors">{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 mt-8 pt-6 border-t border-gray-800 text-xs text-gray-500 flex items-center justify-between flex-wrap gap-2">
          <span>© 2026 SkyRisk · Portfolio project by Nikhil Patil · UMBC Data Science</span>
          <span className="flex items-center gap-1">Made with <Heart className="w-3 h-3 text-red-500 fill-red-500 mx-0.5" /> and ☕</span>
        </div>
      </footer>

      <ChatBubble />
    </div>
  );
}
