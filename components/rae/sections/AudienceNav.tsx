"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, FlaskConical, Briefcase, Users, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/rae/hooks/useLanguage";
import { contentTH } from "@/components/rae/data/content.th";
import { contentEN } from "@/components/rae/data/content.en";

const ICONS: Record<string, React.ElementType> = {
  "graduation-cap": GraduationCap,
  flask: FlaskConical,
  briefcase: Briefcase,
  users: Users,
};

const CARD_COLORS = [
  { bg: "from-[#0a1628] to-[#1a3a5c]", accent: "#00b4a6" },
  { bg: "from-[#0c2340] to-[#1e4976]", accent: "#38bdf8" },
  { bg: "from-[#082220] to-[#0f4a45]", accent: "#34d399" },
  { bg: "from-[#2d1b00] to-[#78350f]", accent: "#f59e0b" },
];

/**
 * Audience-Based Navigation Section.
 * 4 cards: Student, Researcher, Industry, Visitor.
 * Each card shows icon + title + description, expands to show quick links on hover.
 */
export default function AudienceNav() {
  const { lang } = useLanguage();
  const c = lang === "th" ? contentTH : contentEN;
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <section className="py-12 md:py-16 lg:py-24 bg-white dark:bg-slate-950" id="rae-audience" aria-label="Audience Navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10 lg:mb-12">
          <div className="text-xs md:text-sm font-medium text-[#00b4a6] uppercase tracking-[0.18em] mb-2">
            {lang === "th" ? c.audience.subtitle : c.audience.title}
          </div>
          <h2
            className="text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight tracking-tight text-[#0a1628] dark:text-slate-50"
            style={{ fontFamily: lang === "th" ? "'Kanit', sans-serif" : "'Space Grotesk', sans-serif" }}
          >
            {lang === "th" ? c.audience.title : c.audience.subtitle}
          </h2>
          <div className="w-12 h-1 bg-[#00b4a6] rounded-full mx-auto mt-4" />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {c.audience.groups.map((group, idx) => {
            const Icon = ICONS[group.icon] || Users;
            const colors = CARD_COLORS[idx % CARD_COLORS.length];
            const isActive = activeId === group.id;

            return (
              <div
                key={group.id}
                id={`audience-card-${group.id}`}
                className="relative rounded-2xl overflow-hidden cursor-pointer"
                onMouseEnter={() => setActiveId(group.id)}
                onMouseLeave={() => setActiveId(null)}
                onFocus={() => setActiveId(group.id)}
                onBlur={() => setActiveId(null)}
                tabIndex={0}
                role="group"
                aria-label={`${group.title} - ${group.titleEn}`}
              >
                {/* Card Background */}
                <div className={`relative p-6 bg-gradient-to-br ${colors.bg} h-full min-h-[240px] flex flex-col`}>
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200"
                    style={{ backgroundColor: `${colors.accent}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: colors.accent }} aria-hidden="true" />
                  </div>

                  {/* Title */}
                  <div>
                    <h3
                      className="text-lg md:text-xl lg:text-2xl font-semibold leading-snug text-white mb-0.5"
                      style={{ fontFamily: lang === "th" ? "'Kanit', sans-serif" : "'Space Grotesk', sans-serif" }}
                    >
                      {lang === "th" ? group.title : group.titleEn}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-400 mb-3">{lang === "th" ? group.titleEn : group.title}</p>
                  </div>

                  {/* Description (visible when not active) */}
                  <p
                    className={`text-sm text-slate-300 leading-relaxed transition-all duration-300 ${isActive ? "opacity-0 h-0 overflow-hidden" : "opacity-100"}`}
                  >
                    {group.desc}
                  </p>

                  {/* Quick Links (visible when active) */}
                  <div
                    className={`absolute inset-0 p-6 bg-gradient-to-br ${colors.bg} flex flex-col justify-center transition-all duration-300 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
                  >
                    <div
                      className="text-xs font-semibold uppercase tracking-widest mb-4"
                      style={{ color: colors.accent }}
                    >
                      {lang === "th" ? "ลิงก์ด่วน" : "Quick Links"}
                    </div>
                    <ul className="space-y-2">
                      {group.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="flex items-center gap-2 text-sm text-white hover:text-white/80 transition-colors group"
                          >
                            <ChevronRight
                              className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
                              style={{ color: colors.accent }}
                            />
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Accent bottom bar */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-300"
                    style={{ backgroundColor: isActive ? colors.accent : "transparent" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
