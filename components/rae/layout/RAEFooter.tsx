"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/rae/hooks/useLanguage";
import { contentTH } from "@/components/rae/data/content.th";
import { contentEN } from "@/components/rae/data/content.en";

/**
 * RAE Footer with multi-column knowledge hub layout.
 * Includes quick links, resources, contact info, and newsletter signup.
 */
export default function RAEFooter() {
  const { lang } = useLanguage();
  const c = lang === "th" ? contentTH : contentEN;
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <footer className="bg-[#0a1628] dark:bg-slate-950 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1a3a5c] to-[#00b4a6] flex items-center justify-center shadow-md border border-white/10">
                <span className="text-white font-bold text-sm tracking-tight">RAE</span>
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-tight">Research Academy</div>
                <div className="text-xs text-[#00b4a6] font-medium leading-tight">of Excellence</div>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xs">
              {c.footer.mission}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                { label: "Facebook", icon: "f", href: "#" },
                { label: "Twitter", icon: "t", href: "#" },
                { label: "LinkedIn", icon: "in", href: "#" },
                { label: "YouTube", icon: "▶", href: "#" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-slate-300 hover:bg-[#00b4a6] hover:text-white transition-all duration-200"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {c.footer.quickLinks.title}
            </h3>
            <ul className="space-y-2.5">
              {c.footer.quickLinks.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-[#00b4a6] transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Academic Resources */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {c.footer.resources.title}
            </h3>
            <ul className="space-y-2.5">
              {c.footer.resources.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-[#00b4a6] transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {c.footer.contact.title}
            </h3>
            <div className="space-y-2 text-sm text-slate-400 mb-6">
              <p className="leading-relaxed">{c.footer.contact.address}</p>
              <p>
                <a href={`tel:${c.footer.contact.phone}`} className="hover:text-[#00b4a6] transition-colors">
                  {c.footer.contact.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${c.footer.contact.email}`} className="hover:text-[#00b4a6] transition-colors">
                  {c.footer.contact.email}
                </a>
              </p>
              <a
                href={c.footer.contact.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#00b4a6] hover:text-teal-300 transition-colors text-xs font-medium"
              >
                <span>View on Map</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Newsletter */}
            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-wider mb-2">
                {c.footer.newsletter.title}
              </p>
              {subscribed ? (
                <p className="text-xs text-[#00b4a6] font-medium">
                  {lang === "th" ? "สมัครสำเร็จ!" : "Subscribed!"}
                </p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={c.footer.newsletter.placeholder}
                    required
                    className="flex-1 min-w-0 px-3 py-2 text-xs bg-white/10 border border-white/20 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-[#00b4a6] focus:ring-1 focus:ring-[#00b4a6] transition-all"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 text-xs font-semibold text-white bg-[#00b4a6] rounded-md hover:bg-teal-400 transition-colors whitespace-nowrap"
                  >
                    {c.footer.newsletter.button}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">{c.footer.copyright}</p>
            <div className="flex items-center gap-4">
              {/* Accreditation badges */}
              <div className="flex items-center gap-2">
                {["AACSB", "QS", "THE"].map((badge) => (
                  <span
                    key={badge}
                    className="px-2 py-0.5 text-xs font-bold text-slate-400 border border-white/10 dark:border-slate-800 rounded"
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <Link href="/sitemap" className="text-xs text-slate-500 hover:text-[#00b4a6] transition-colors">
                Sitemap
              </Link>
              <Link href="/privacy" className="text-xs text-slate-500 hover:text-[#00b4a6] transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
