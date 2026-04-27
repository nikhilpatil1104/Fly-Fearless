"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DynamicHeading from "./DynamicHeading";
import type { DealHeadingState } from "@/lib/deals";

const HERO_IMAGES: Record<string, string> = {
  ORD: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=80",
  ATL: "https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=1600&q=80",
  JFK: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=1600&q=80",
  LAX: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1600&q=80",
  DFW: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=80",
  DEN: "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=1600&q=80",
  SFO: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=1600&q=80",
  MIA: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
  DEFAULT: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=80",
};

interface Props {
  heading: DealHeadingState;
  children: React.ReactNode;
}

export default function HeroSection({ heading, children }: Props) {
  const [imgSrc, setImgSrc] = useState(HERO_IMAGES.ATL);
  const [imgKey, setImgKey] = useState(0);

  useEffect(() => {
    const iata = heading.deal.destIATA;
    const newSrc = HERO_IMAGES[iata] ?? HERO_IMAGES.DEFAULT;
    if (newSrc !== imgSrc) {
      setImgSrc(newSrc);
      setImgKey((k) => k + 1);
    }
  }, [heading.deal.destIATA]); // eslint-disable-line

  return (
    <section className="relative bg-gray-900" style={{zIndex: 0}}>
      {/* Clip container for images only — NOT for the search card */}
      <div className="relative h-[580px] overflow-hidden">
        {/* Crossfade images */}
        <AnimatePresence>
          <motion.div
            key={imgKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0"
            style={{ backgroundImage: `url(${imgSrc})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        </AnimatePresence>
        {/* Permanent dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/35 to-black/60" />
      </div>

      {/* Search card — positioned OVER the image clip container, can overflow freely */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 lg:px-6"
           style={{zIndex: 10}}>
        <div className="w-full max-w-[900px]">
          <div className="px-2 pb-6">
            <DynamicHeading
              deal={heading.deal}
              fadeKey={heading.fadeKey}
              isLive={heading.isLive}
            />
          </div>
          {/* Search card — overflow visible so dropdowns can escape */}
          <div className="bg-white dark:bg-[#1C1F26] rounded-2xl px-6 py-4 shadow-2xl"
               style={{overflow: "visible", position: "relative", zIndex: 20}}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
