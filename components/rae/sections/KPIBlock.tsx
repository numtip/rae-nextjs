"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/rae/hooks/useLanguage";
import { contentTH } from "@/components/rae/data/content.th";
import { contentEN } from "@/components/rae/data/content.en";

interface KPIStatProps {
  value: number;
  suffix: string;
  label: string;
  labelEn: string;
  inView: boolean;
}

/**
 * Animated counter for a single KPI stat.
 * Counts from 0 to value when inView becomes true.
 */
function KPIStat({ value, suffix, label, labelEn, inView }: KPIStatProps) {
  const { lang } = useLanguage();
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!inView || startedRef.current) return;
    startedRef.current = true;

    const duration = 1800;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + increment, value);
      setCount(Math.floor(current));
      if (current >= value) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <div className="text-center group">
      <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-2 tabular-nums">
        {count}
        <span className="text-[#00b4a6]">{suffix}</span>
      </div>
      <div
        className="text-sm font-semibold text-slate-300 group-hover:text-[#00b4a6] transition-colors"
        style={{ fontFamily: lang === "th" ? "'Sarabun', sans-serif" : "'Inter', sans-serif" }}
      >
        {lang === "th" ? label : labelEn}
      </div>
    </div>
  );
}

/**
 * KPI / Impact Block — Full-width dark section with animated counters.
 * Animated count-up triggers on scroll into view via IntersectionObserver.
 */
export default function KPIBlock() {
  const { lang } = useLanguage();
  const c = lang === "th" ? contentTH : contentEN;
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-12 md:py-16 lg:py-24 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a3a5c 100%)" }}
      id="rae-impact"
      aria-label="Impact Statistics"
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0,180,166,0.8) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10 lg:mb-12">
          <div className="text-xs md:text-sm font-medium text-[#00b4a6] uppercase tracking-[0.18em] mb-2">
            {lang === "th" ? c.kpi.subtitle : c.kpi.title}
          </div>
          <h2
            className="text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight tracking-tight text-white"
            style={{ fontFamily: lang === "th" ? "'Kanit', sans-serif" : "'Space Grotesk', sans-serif" }}
          >
            {lang === "th" ? c.kpi.title : c.kpi.subtitle}
          </h2>
          <div className="w-12 h-1 bg-[#00b4a6] rounded-full mx-auto mt-4" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {c.kpi.stats.map((stat) => (
            <KPIStat
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              labelEn={stat.labelEn}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
