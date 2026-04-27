"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeftRight, Clock, Bell, Gift, Sparkles } from "lucide-react";
import Navbar from "@/components/navbar/Navbar";
import ChatBubble from "@/components/chat-bubble/ChatBubble";
import { FEATURED_DEALS } from "@/lib/deals";
import { CURATED_AIRPORTS } from "@/lib/airports";

const FAQ_TEMPLATE = (orig: string, dest: string, airline: string, price: number) => [
  { q: `How much is a ${airline} flight from ${orig} to ${dest}?`, a: `Prices start at $${price} one-way based on recent searches. Fares change based on demand, date, and availability.` },
  { q: `What is the cheapest month to fly from ${orig} to ${dest}?`, a: `February and September tend to offer the lowest fares. Booking 6–8 weeks in advance on a Sunday typically yields the best prices.` },
  { q: `Does ${airline} fly nonstop from ${orig} to ${dest}?`, a: `${airline} operates multiple daily flights on this route. Nonstop availability depends on your selected date.` },
  { q: `How long is the flight from ${orig} to ${dest}?`, a: `Nonstop flights average 2–3 hours. Connecting itineraries can take 4–8 hours depending on layover.` },
  { q: `Which day of the week has the cheapest flights?`, a: `Tuesday and Wednesday departures are typically 15–20% cheaper than Friday or Sunday for most US routes.` },
];

export default function DealsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const origin = searchParams.get("origin") ?? "ORD";
  const destination = searchParams.get("destination") ?? "ATL";

  const originAirport = CURATED_AIRPORTS.find((a) => a.iata === origin);
  const destAirport = CURATED_AIRPORTS.find((a) => a.iata === destination);

  const currentDeal = FEATURED_DEALS.find((d) => d.origIATA === origin && d.destIATA === destination)
    ?? FEATURED_DEALS[0];

  const [filter, setFilter] = useState<"All deals" | "One way" | "Roundtrip">("Roundtrip");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faq = FAQ_TEMPLATE(
    originAirport?.city ?? origin,
    destAirport?.city ?? destination,
    currentDeal.airline,
    currentDeal.price
  );

  const ALT_AIRPORTS = [
    { iata: "BHM", name: "Birmingham-Shuttlesworth", label: "Cheapest", drive: "2h 40m", price: currentDeal.price - 49 },
    { iata: "CHA", name: "Chattanooga Metro.", label: "Average", drive: "1h 50m", price: currentDeal.price - 8 },
    { iata: "HSV", name: "Huntsville Intl.", label: "Average", drive: "3h 20m", price: currentDeal.price + 10 },
  ];

  return (
    <div className="min-h-screen bg-[var(--sky-bg)]">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-10">
        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          ${currentDeal.price} Cheap {currentDeal.airline} flights{" "}
          {originAirport?.city ?? origin} ({origin}) to {destAirport?.city ?? destination} ({destination})
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-4xl">
          Prices were available within the past 7 days and start at ${currentDeal.price} for one-way flights and $
          {currentDeal.price * 2 - 3} for round trip. Prices and availability are subject to change. Additional terms apply.
        </p>

        {/* Filter pills */}
        <div className="flex items-center gap-2 mb-6">
          {(["All deals", "One way", "Roundtrip"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                filter === f
                  ? "bg-blue-50 dark:bg-blue-950/40 border-[var(--sky-primary)] text-[var(--sky-primary)]"
                  : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Deal cards */}
        <div className="space-y-3 mb-12">
          {FEATURED_DEALS.filter((d) =>
            filter === "All deals" ? true : filter === "One way" ? d.type === "One-way" : d.type === "Roundtrip"
          ).map((deal, i) => (
            <div
              key={i}
              onClick={() =>
                router.push(
                  `/flights/search?origin=${deal.origIATA}&destination=${deal.destIATA}&tripType=${deal.type}&adults=1&cabin=Economy`
                )
              }
              className="flex items-center gap-6 bg-white dark:bg-[#1C1F26]
                         border border-gray-200 dark:border-gray-800 rounded-2xl p-5
                         hover:shadow-lg hover:border-[var(--sky-primary)]
                         transition-all duration-200 cursor-pointer max-w-2xl"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                style={{
                  backgroundColor: { DL: "#E01933", AA: "#0078D2", UA: "#002244", WN: "#F9B612", B6: "#003876", AS: "#01426A", NK: "#3D0095", F9: "#006F53" }[deal.code] ?? "#374151",
                }}
              >
                {deal.code}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--sky-primary)] font-semibold text-sm mb-1">{deal.date}</p>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{deal.origIATA}</p>
                    <p className="text-xs text-gray-400">{deal.orig}</p>
                  </div>
                  <ArrowLeftRight className="w-4 h-4 text-gray-300" />
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{deal.destIATA}</p>
                    <p className="text-xs text-gray-400">{deal.dest}</p>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">${deal.price}</p>
                <p className="text-xs text-gray-400">{deal.type}</p>
                <p className="text-[10px] text-[var(--sky-green)] font-semibold">just found</p>
              </div>
            </div>
          ))}
        </div>

        {/* Alternative airports */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">
          Alternative airports near {destAirport?.city ?? destination}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {ALT_AIRPORTS.map((a) => (
            <div key={a.iata} className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:shadow-md cursor-pointer hover:border-[var(--sky-primary)] transition-all">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-900 dark:text-white">{a.iata}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${a.label === "Cheapest" ? "bg-green-100 text-[var(--sky-green)]" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>{a.label}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{a.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                <Clock className="w-3.5 h-3.5" /> {a.drive} drive
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-400">from</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${a.price}</p>
                </div>
                <button className="text-xs font-semibold text-[var(--sky-primary)] hover:underline">View →</button>
              </div>
            </div>
          ))}
        </div>

        {/* Be in the know */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">Be in the know</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: <Bell className="w-5 h-5" />, text: "Get alerts if flight prices drop or rise", bg: "bg-blue-50 dark:bg-blue-950/30", clr: "text-[var(--sky-primary)]" },
            { icon: <Gift className="w-5 h-5" />, text: "Save up to 30% on hotels after booking a flight", bg: "bg-amber-50 dark:bg-amber-950/30", clr: "text-amber-600" },
            { icon: <Sparkles className="w-5 h-5" />, text: "Earn airline miles on top of our OneKeyCash", bg: "bg-emerald-50 dark:bg-emerald-950/30", clr: "text-[var(--sky-green)]" },
          ].map((c, i) => (
            <div key={i} className={`${c.bg} rounded-2xl p-5 flex items-start gap-4`}>
              <div className={`${c.clr} w-10 h-10 rounded-full bg-white dark:bg-[#1C1F26] flex items-center justify-center shadow-sm`}>{c.icon}</div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.text}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">Frequently asked questions</h2>
        <div className="border-t border-gray-200 dark:border-gray-800">
          {faq.map((item, i) => (
            <div key={i} className="border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-4 text-left gap-4"
              >
                <span className="font-semibold text-gray-900 dark:text-white">{item.q}</span>
                <span className="text-gray-400 flex-shrink-0">{openFaq === i ? "▲" : "▼"}</span>
              </button>
              {openFaq === i && (
                <div className="pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <ChatBubble />
    </div>
  );
}
