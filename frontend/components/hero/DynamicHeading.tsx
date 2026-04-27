"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { FeaturedDeal } from "@/lib/types";

interface Props {
  deal: FeaturedDeal;
  fadeKey: number;
  isLive?: boolean;
}

export default function DynamicHeading({ deal, fadeKey, isLive }: Props) {
  return (
    <div className="relative min-h-[120px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={fadeKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <h1 className="text-3xl md:text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
            {/* Bright yellow-white for the price — high contrast on any image */}
            <span style={{ color: "#7dd3fc" }}>${deal.price}</span>{" "}
            Cheap {deal.airline} flights{" "}
            <span className="whitespace-nowrap">{deal.orig} ({deal.origIATA})</span>{" "}
            to{" "}
            <span className="whitespace-nowrap">{deal.dest} ({deal.destIATA})</span>
          </h1>

          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <a
              href="/flights/search"
              style={{ color: "#93c5fd", textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}
              className="inline-flex items-center gap-1 font-semibold text-base hover:underline"
            >
              View ${deal.price} {deal.type.toLowerCase()} on {deal.date} →
            </a>
            {isLive && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-300 bg-green-900/50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live price
              </span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
