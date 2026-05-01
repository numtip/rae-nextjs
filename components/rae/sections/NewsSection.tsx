"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/rae/hooks/useLanguage";
import { contentTH } from "@/components/rae/data/content.th";
import { contentEN } from "@/components/rae/data/content.en";

const CATEGORY_STYLES: Record<string, string> = {
  research: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  event: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  award: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  announcement: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

/**
 * News & Events Section — 3-column card grid with category badges.
 * Single column on mobile, 3 columns on lg.
 */
export default function NewsSection() {
  const { lang } = useLanguage();
  const c = lang === "th" ? contentTH : contentEN;

  return (
    <section className="py-12 md:py-16 lg:py-24 bg-slate-50 dark:bg-slate-900/60" id="rae-news" aria-label="News and Events">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 md:mb-10 lg:mb-12 gap-4 md:gap-6 lg:gap-8">
          <div>
            <div className="text-xs md:text-sm font-medium text-[#00b4a6] uppercase tracking-[0.18em] mb-2">
              {lang === "th" ? c.news.subtitle : c.news.title}
            </div>
            <h2
              className="text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight tracking-tight text-[#0a1628] dark:text-slate-50"
              style={{ fontFamily: lang === "th" ? "'Kanit', sans-serif" : "'Space Grotesk', sans-serif" }}
            >
              {lang === "th" ? c.news.title : c.news.subtitle}
            </h2>
          </div>
          <Link
            href="/news"
            id="news-view-all"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#00b4a6] hover:text-teal-700 transition-colors whitespace-nowrap"
          >
            {c.news.viewAll}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {c.news.items.map((item, idx) => (
            <article
              key={item.id}
              className={`group bg-white dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 dark:border-slate-800 hover:shadow-xl dark:shadow-none hover:-translate-y-1 transition-all duration-300 ${idx === 0 ? "md:col-span-2 lg:col-span-1" : ""}`}
            >
              {/* Image placeholder */}
              <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-150 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/40 to-transparent group-hover:from-[#0a1628]/20 transition-all duration-300" />
                {/* Category badge */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${CATEGORY_STYLES[item.category] || CATEGORY_STYLES.announcement}`}>
                    {c.news.categories[item.category as keyof typeof c.news.categories] || item.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 md:p-6 lg:p-8">
                <time className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 font-medium">{item.date}</time>
                <h3
                  className="mt-1.5 text-lg md:text-xl lg:text-2xl font-semibold leading-snug text-[#0a1628] dark:text-slate-50 group-hover:text-[#00b4a6] transition-colors leading-snug mb-2"
                  style={{ fontFamily: lang === "th" ? "'Sarabun', sans-serif" : "'Inter', sans-serif" }}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
                  {item.excerpt}
                </p>
                <Link
                  href={item.link}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#00b4a6] hover:text-teal-700 transition-colors group-hover:gap-2"
                >
                  <span>{lang === "th" ? "อ่านต่อ" : "Read More"}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
