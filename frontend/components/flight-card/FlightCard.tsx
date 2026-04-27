"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Luggage,
  RefreshCw,
  Plane,
} from "lucide-react";
import type { FlightOffer } from "@/lib/types";
import { format, parseISO } from "date-fns";

const AIRLINE_COLORS: Record<string, string> = {
  DL: "#E01933", AA: "#0078D2", UA: "#002244", WN: "#F9B612",
  B6: "#003876", AS: "#01426A", NK: "#3D0095", F9: "#006F53",
  G4: "#0052A5", SY: "#CC0000",
};

function AirlineLogo({ code, name, size = "md" }: { code: string; name: string; size?: "sm" | "md" }) {
  const [imgOk, setImgOk] = useState(true);
  const sz = size === "sm" ? "w-9 h-9 text-[10px]" : "w-12 h-12 text-xs";
  const bg = AIRLINE_COLORS[code] ?? "#374151";

  if (imgOk) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://www.gstatic.com/flights/airline_logos/70px/${code}.png`}
        alt={name}
        onError={() => setImgOk(false)}
        className={`${sz} object-contain rounded-lg`}
      />
    );
  }
  return (
    <div
      className={`${sz} rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ backgroundColor: bg }}
    >
      {code}
    </div>
  );
}

function ItinerarySummary({ itin, label }: { itin: FlightOffer["outbound"]; label?: string }) {
  const dep = parseISO(itin.departure);
  const arr = parseISO(itin.arrival);
  return (
    <div>
      {label && <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</p>}
      <div className="flex items-center gap-3">
        <div className="text-center">
          <p className="text-base font-bold text-gray-900 dark:text-white">{format(dep, "h:mm a")}</p>
          <p className="text-xs text-gray-500">{itin.origin}</p>
        </div>
        <div className="flex-1 flex flex-col items-center gap-0.5">
          <p className="text-[10px] text-gray-500">{itin.duration} · {itin.stopsLabel}</p>
          <div className="relative w-full flex items-center">
            <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1" />
            <Plane className="w-3 h-3 text-gray-400 mx-1 rotate-90" />
            <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1" />
          </div>
          {itin.layoverAirports.length > 0 && (
            <p className="text-[10px] text-gray-500">{itin.layoverAirports.join(" · ")}</p>
          )}
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-gray-900 dark:text-white">{format(arr, "h:mm a")}</p>
          <p className="text-xs text-gray-500">{itin.destination}</p>
        </div>
      </div>
    </div>
  );
}

interface Props {
  offer: FlightOffer;
  badge?: "Cheapest" | "Best" | null;
  index?: number;
  onSelect?: (offer: FlightOffer) => void;
}

export default function FlightCard({ offer, badge, index = 0, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false);

  const airlineCode = offer.airline;
  const airlineName = offer.airlineName ?? offer.airline;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-white dark:bg-[#1C1F26]
                 border border-gray-200 dark:border-gray-800
                 rounded-2xl overflow-hidden
                 hover:shadow-lg hover:border-[var(--sky-primary)]
                 transition-all duration-200"
    >
      <div className="p-5">
        <div className="flex items-start gap-5">
          {/* Airline logo */}
          <div className="flex-shrink-0 mt-1">
            <AirlineLogo code={airlineCode} name={airlineName} />
          </div>

          {/* Flight info */}
          <div className="flex-1 min-w-0 space-y-2">
            {badge && (
              <span
                className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-1 ${
                  badge === "Cheapest"
                    ? "bg-green-100 dark:bg-green-900/40 text-[var(--sky-green)]"
                    : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                }`}
              >
                {badge}
              </span>
            )}

            <ItinerarySummary itin={offer.outbound} label={offer.inbound ? "Outbound" : undefined} />
            {offer.inbound && (
              <ItinerarySummary itin={offer.inbound} label="Return" />
            )}

            {/* Amenities */}
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mt-1">
              {offer.carryOn && (
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-[var(--sky-green)]" /> Carry-on included
                </span>
              )}
              {offer.checkedBags > 0 ? (
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-[var(--sky-green)]" />
                  {offer.checkedBags} checked bag{offer.checkedBags > 1 ? "s" : ""}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-400">
                  <X className="w-3 h-3" /> No checked bag
                </span>
              )}
              {offer.refundable && (
                <span className="flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-[var(--sky-primary)]" /> Refundable
                </span>
              )}
              <span className="flex items-center gap-1">
                <Luggage className="w-3 h-3" /> {offer.cabin}
              </span>
            </div>
          </div>

          {/* Price + CTA */}
          <div className="flex-shrink-0 flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${offer.price.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">
                {offer.inbound ? "Roundtrip" : "One-way"} per traveler
              </p>
              <p className="text-xs text-[var(--sky-green)] font-semibold">just found</p>
            </div>
            <button
              onClick={() => onSelect?.(offer)}
              className="px-6 py-2.5 bg-[var(--sky-primary)] hover:bg-[var(--sky-primary-hover)]
                         text-white text-sm font-bold rounded-full
                         transition-colors shadow-sm hover:shadow-md"
            >
              Select
            </button>
          </div>
        </div>

        {/* Expand/collapse details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs font-semibold text-[var(--sky-primary)] hover:underline"
        >
          Flight details
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expanded segment details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4">
              {[
                ...(offer.outbound?.segments ?? []),
                ...(offer.inbound?.segments ?? []),
              ].map((seg, i) => (
                <div key={i} className="flex items-start gap-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div className="w-9 h-9 flex-shrink-0">
                    <AirlineLogo code={seg.airline} name={seg.airline} size="sm" />
                  </div>
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-700 dark:text-gray-300">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {seg.airline}{seg.flightNumber}
                      </p>
                      <p className="text-gray-500">Flight</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {seg.origin} → {seg.destination}
                      </p>
                      <p className="text-gray-500">Route</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {seg.aircraft || "Commercial aircraft"}
                      </p>
                      <p className="text-gray-500">Aircraft</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {seg.operating !== seg.airline ? `Operated by ${seg.operating}` : "Direct service"}
                      </p>
                      <p className="text-gray-500">Operator</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 text-xs text-gray-600 dark:text-gray-400">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-0.5">Fare rules</p>
                  <p>{offer.refundable ? "Refundable (fee may apply)" : "Non-refundable"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-0.5">Seat selection</p>
                  <p>Available at checkout</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-0.5">Carbon estimate</p>
                  <p>~185 kg CO₂ · 5% below avg</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
