"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/rae/hooks/useLanguage";
import { contentTH } from "@/components/rae/data/content.th";
import { contentEN } from "@/components/rae/data/content.en";

/**
 * Announcement Ticker — Scrolling news ribbon below hero.
 * Auto-scrolling with pause on hover.
 */
export default function AnnouncementTicker() {
  const { lang } = useLanguage();
  const c = lang === "th" ? contentTH : contentEN;
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const items = c.ticker.items;

  return (
    <div
      className="w-full bg-[#0a1628] border-b border-[#00b4a6]/20 py-2.5 overflow-hidden"
      id="rae-ticker"
      aria-label="Announcements ticker"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 md:gap-6 lg:gap-8">
        {/* Label */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00b4a6] animate-pulse" />
          <span className="text-xs font-semibold text-[#00b4a6] uppercase tracking-wider whitespace-nowrap">
            {c.ticker.label}
          </span>
        </div>

        {/* Scrolling Content */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className={`flex gap-12 items-center ${isPaused ? "" : "animate-[ticker_30s_linear_infinite]"}`}
            style={{
              animation: isPaused ? "none" : "ticker 30s linear infinite",
            }}
          >
            {[...items, ...items].map((item, i) => (
              <div key={i} className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-slate-300 whitespace-nowrap">{item}</span>
                <ChevronRight className="w-3 h-3 text-[#00b4a6] flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
