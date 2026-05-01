"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useLanguage } from "@/components/rae/hooks/useLanguage";
import { contentTH } from "@/components/rae/data/content.th";
import { contentEN } from "@/components/rae/data/content.en";

/**
 * RAE institutional header with sticky navigation, language toggle, theme toggle, and mobile menu.
 * Mobile-first: hamburger drawer on sm, full nav on lg+.
 */
export default function RAEHeader() {
  const { lang, setLang } = useLanguage();
  const c = lang === "th" ? contentTH : contentEN;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("rae-theme");
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
      if (saved === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
      if (prefersDark) document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("rae-theme", next);
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const navItems = [
    { label: c.nav.about, href: "/about" },
    { label: c.nav.research, href: "/research" },
    { label: c.nav.education, href: "/education" },
    { label: c.nav.news, href: "/news" },
    { label: c.nav.impact, href: "/impact" },
    { label: c.nav.contact, href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/50 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-24 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-[#00b4a6] rounded-lg outline-none" aria-label="RAE Homepage">
            <div className="h-10 w-10 lg:w-12 lg:h-12 object-contain max-h-full rounded-xl bg-gradient-to-br from-[#0a1628] to-[#00b4a6] flex items-center justify-center shadow-md group-hover:shadow-lg transition-all border border-transparent dark:border-slate-700/50">
              <span className="text-white font-bold text-sm lg:text-base tracking-tight">RAE</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm lg:text-base font-bold text-[#0a1628] dark:text-slate-50 leading-tight transition-colors">
                Research Academy
              </div>
              <div className="text-xs lg:text-sm text-[#00b4a6] font-medium leading-tight">
                of Excellence
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-md hover:text-[#0a1628] dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#00b4a6] outline-none"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#00b4a6] outline-none"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === "th" ? "en" : "th")}
              className="px-3 py-1.5 text-xs font-semibold text-[#0a1628] dark:text-slate-50 border border-slate-200 dark:border-slate-700 rounded-full hover:border-[#00b4a6] dark:hover:border-[#00b4a6] hover:text-[#00b4a6] dark:hover:text-[#00b4a6] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#00b4a6] outline-none"
              aria-label="Toggle language"
            >
              {c.nav.langToggle}
            </button>

            {/* CTA Button */}
            <Link
              href="/apply"
              className="hidden sm:flex items-center px-5 py-2 md:px-6 md:py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-[#0a1628] to-[#1a3a5c] dark:from-[#1a3a5c] dark:to-[#2a5a8c] rounded-full hover:from-[#1a3a5c] hover:to-[#00b4a6] transition-all duration-200 shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#00b4a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 outline-none"
            >
              {c.nav.applyNow}
            </Link>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-[#0a1628] dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus-visible:ring-2 focus-visible:ring-[#00b4a6] outline-none"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-md hover:text-[#0a1628] dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
              <Link
                href="/apply"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#0a1628] to-[#1a3a5c] dark:from-[#1a3a5c] dark:to-[#2a5a8c] rounded-full hover:from-[#1a3a5c] hover:to-[#00b4a6] transition-all"
              >
                {c.nav.applyNow}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
