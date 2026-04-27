"use client";

import { AnimatePresence, motion } from "framer-motion";
import SearchBar from "./SearchBar";
import type { SearchState } from "@/lib/types";

interface Props {
  show: boolean;
  state: SearchState;
  onChange: (s: SearchState) => void;
  onSubmit: () => void;
}

/**
 * Slides down from under the Navbar when the hero sentinel leaves the viewport.
 * z-index sits between navbar (60) and dropdowns (50) so dropdowns render above.
 */
export default function StickySearchBar({ show, state, onChange, onSubmit }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="sticky-bar"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed top-14 left-0 right-0 z-[55]
                     bg-white/95 dark:bg-[#0F1117]/95
                     backdrop-blur-sm
                     border-b border-gray-200 dark:border-gray-800
                     shadow-md"
        >
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-2">
            <SearchBar
              state={state}
              onChange={onChange}
              onSubmit={onSubmit}
              compact
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
