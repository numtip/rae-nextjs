"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useLanguage } from "@/components/rae/hooks/useLanguage";
import { contentTH } from "@/components/rae/data/content.th";
import { contentEN } from "@/components/rae/data/content.en";

/** Particle data shape — generated once on client mount */
interface Particle {
  width: number;
  height: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
}

/**
 * Client-only floating particles.
 * Renders nothing on server (null), populates after mount via useEffect.
 * This prevents SSR/client Math.random() hydration mismatch.
 */
function HeroParticles() {
  const [particles, setParticles] = useState<Particle[] | null>(null);

  useEffect(() => {
    // Generate once on client — never runs on server
    setParticles(
      Array.from({ length: 12 }, () => ({
        width: Math.random() * 6 + 2,
        height: Math.random() * 6 + 2,
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: Math.random() * 4 + 3,
      }))
    );
  }, []);

  // Server render: empty container (no random values)
  if (!particles) return null;

  return (
    <>
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#00b4a6] opacity-20 animate-pulse"
          style={{
            width: `${p.width}px`,
            height: `${p.height}px`,
            top: `${p.top}%`,
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </>
  );
}

/**
 * Hero Section for RAE institutional website.
 * Full-viewport deep navy gradient with animated particles overlay.
 * Bilingual: Thai headline + English subtitle.
 */
export default function HeroSection() {
  const { lang } = useLanguage();
  const c = lang === "th" ? contentTH : contentEN;

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a3a5c 50%, #0a1628 100%)" }}
      id="rae-hero"
      aria-label="RAE Hero Section"
    >
      {/* Animated Grid Overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 180, 166, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 180, 166, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating Particles — client-only, no SSR random values */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <HeroParticles />
      </div>

      {/* Radial Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #00b4a6 0%, transparent 70%)" }}
      />

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-[#00b4a6]/30 bg-[#00b4a6]/10 text-[#00b4a6] text-xs font-semibold tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00b4a6] animate-pulse" />
          Research Academy of Excellence
        </div>

        {/* Title */}
        <h1
          className="text-3xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-white leading-tight mb-2"
          style={{ fontFamily: lang === "th" ? "'Kanit', sans-serif" : "'Space Grotesk', sans-serif" }}
        >
          {c.hero.title}
        </h1>
        <div
          className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6"
          style={{
            background: "linear-gradient(90deg, #00b4a6, #38bdf8, #00b4a6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: lang === "th" ? "'Kanit', sans-serif" : "'Space Grotesk', sans-serif",
          }}
        >
          {c.hero.subtitle}
        </div>

        {/* Description */}
        <p
          className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 md:mb-10 lg:mb-12 leading-relaxed"
          style={{ fontFamily: lang === "th" ? "'Sarabun', sans-serif" : "'Inter', sans-serif" }}
        >
          {c.hero.description}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 lg:gap-8">
          <Link
            href="/research"
            id="hero-cta-research"
            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-[#0a1628] dark:text-slate-50 bg-[#00b4a6] rounded-xl hover:bg-teal-400 hover:-translate-y-0.5 transition-all duration-200 shadow-lg dark:shadow-none shadow-[#00b4a6]/25 hover:shadow-xl dark:shadow-none hover:shadow-[#00b4a6]/30"
          >
            {c.hero.ctaPrimary}
          </Link>
          <Link
            href="/apply"
            id="hero-cta-apply"
            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white border-2 border-white/30 rounded-xl hover:border-[#00b4a6] hover:text-[#00b4a6] hover:-translate-y-0.5 transition-all duration-200 backdrop-blur-sm"
          >
            {c.hero.ctaSecondary}
          </Link>
        </div>

        {/* Stats mini bar */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 lg:gap-8 border-t border-white/10 pt-10">
          {[
            { num: "500+", label: lang === "th" ? "ผลงานวิจัย" : "Publications" },
            { num: "150+", label: lang === "th" ? "โครงการ" : "Projects" },
            { num: "50+", label: lang === "th" ? "พันธมิตร" : "Partners" },
            { num: "30+", label: lang === "th" ? "ความร่วมมือนานาชาติ" : "Int'l Collaborations" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-[#00b4a6]">{stat.num}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
        <span className="text-xs">{c.hero.scrollHint}</span>
        <div className="w-5 h-8 border-2 border-slate-500 rounded-full flex justify-center pt-1.5">
          <div className="w-1 h-2 bg-[#00b4a6] rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
