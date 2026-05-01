"use client";

import Link from "next/link";
import {
  FlaskConical, BookOpen, DollarSign, Calendar,
  User, Microscope, FileText, Globe,
} from "lucide-react";
import { useLanguage } from "@/components/rae/hooks/useLanguage";
import { contentTH } from "@/components/rae/data/content.th";
import { contentEN } from "@/components/rae/data/content.en";

const ICONS: Record<string, React.ElementType> = {
  flask: FlaskConical,
  "book-open": BookOpen,
  "dollar-sign": DollarSign,
  calendar: Calendar,
  "user-graduate": User,
  microscope: Microscope,
  "file-text": FileText,
  globe: Globe,
};

/**
 * Quick Services Grid — 8 tiles in 4×2 layout (2×4 on mobile).
 * Each tile: icon + bilingual labels + hover teal accent border.
 */
export default function QuickServicesGrid() {
  const { lang } = useLanguage();
  const c = lang === "th" ? contentTH : contentEN;

  return (
    <section className="py-12 md:py-16 lg:py-24 bg-slate-50 dark:bg-slate-900/60" id="rae-services" aria-label="Quick Services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-10 lg:mb-12">
          <h2
            className="text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight tracking-tight text-[#0a1628] dark:text-slate-50 mb-2"
            style={{ fontFamily: lang === "th" ? "'Kanit', sans-serif" : "'Space Grotesk', sans-serif" }}
          >
            {c.services.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-500 dark:text-slate-400 text-sm">{c.services.subtitle}</p>
          <div className="w-12 h-1 bg-[#00b4a6] rounded-full mx-auto mt-3" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {c.services.items.map((item) => {
            const Icon = ICONS[item.icon] || Globe;
            return (
              <Link
                key={item.id}
                href={`/services/${item.id}`}
                id={`service-tile-${item.id}`}
                className="group flex flex-col items-center text-center p-5 md:p-6 lg:p-8 bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-200 dark:border-slate-800 dark:border-slate-800 hover:border-[#00b4a6] hover:-translate-y-1 hover:shadow-lg dark:shadow-none transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f0fdfc] to-[#ccfbf1] flex items-center justify-center mb-3 group-hover:from-[#00b4a6] group-hover:to-[#0891b2] transition-all duration-200">
                  <Icon
                    className="w-5 h-5 text-[#00b4a6] group-hover:text-white transition-colors duration-200"
                    aria-hidden="true"
                  />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[#0a1628] dark:text-slate-50 group-hover:text-[#00b4a6] transition-colors leading-tight mb-1">
                  {item.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 leading-tight">{item.desc}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
