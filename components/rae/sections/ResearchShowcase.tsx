"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/rae/hooks/useLanguage";
import { contentTH } from "@/components/rae/data/content.th";
import { contentEN } from "@/components/rae/data/content.en";

const TAG_COLORS: Record<string, string> = {
  teal: "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800/50",
  blue: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50",
  green: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50",
  amber: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50",
};

/**
 * Research Showcase Section — 4 research area cards.
 * Horizontal scroll on mobile, 4-column grid on desktop.
 */
export default function ResearchShowcase() {
  const { lang } = useLanguage();
  const c = lang === "th" ? contentTH : contentEN;

  return (
    <section className="py-12 md:py-16 lg:py-24 bg-white dark:bg-slate-950" id="rae-research" aria-label="Research Areas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 md:mb-10 lg:mb-12 gap-4 md:gap-6 lg:gap-8">
          <div>
            <div className="text-xs md:text-sm font-medium text-[#00b4a6] uppercase tracking-[0.18em] mb-2">
              {lang === "th" ? c.research.subtitle : c.research.title}
            </div>
            <h2
              className="text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight tracking-tight text-[#0a1628] dark:text-slate-50"
              style={{ fontFamily: lang === "th" ? "'Kanit', sans-serif" : "'Space Grotesk', sans-serif" }}
            >
              {lang === "th" ? c.research.title : c.research.subtitle}
            </h2>
          </div>
          <Link
            href="/research"
            id="research-view-all"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#00b4a6] hover:text-teal-700 transition-colors whitespace-nowrap"
          >
            {c.research.viewAll}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Cards — horizontal scroll on mobile */}
        <div className="flex gap-4 md:gap-6 lg:gap-8 overflow-x-auto pb-4 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 snap-x snap-mandatory">
          {c.research.areas.map((area) => (
            <Link
              key={area.id}
              href={area.link}
              id={`research-card-${area.id}`}
              className="group flex-shrink-0 w-72 lg:w-auto snap-start bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl dark:shadow-none hover:-translate-y-1 transition-all duration-300"
            >
              {/* Image placeholder */}
              <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/60 to-[#00b4a6]/20 group-hover:from-[#0a1628]/40 transition-all duration-300" />
                <div className="absolute bottom-3 left-3">
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${TAG_COLORS[area.tagColor] || TAG_COLORS.teal}`}>
                    {area.tag}
                  </span>
                </div>
                {/* Placeholder icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 md:p-6 lg:p-8">
                <h3
                  className="text-lg md:text-xl lg:text-2xl font-semibold leading-snug text-[#0a1628] dark:text-slate-50 mb-2 group-hover:text-[#00b4a6] transition-colors leading-snug"
                  style={{ fontFamily: lang === "th" ? "'Sarabun', sans-serif" : "'Inter', sans-serif" }}
                >
                  {area.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
                  {area.desc}
                </p>
                <div className="flex items-center gap-1 text-xs font-semibold text-[#00b4a6] group-hover:gap-2 transition-all">
                  <span>{lang === "th" ? "เรียนรู้เพิ่มเติม" : "Learn More"}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
