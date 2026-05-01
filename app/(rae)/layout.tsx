"use client";

import { LanguageProvider } from "@/components/rae/hooks/useLanguage";
import RAEHeader from "@/components/rae/layout/RAEHeader";
import RAEFooter from "@/components/rae/layout/RAEFooter";

/**
 * RAE route group layout.
 * Provides bilingual context + sticky header + footer to all (rae) pages.
 */
export default function RAELayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col bg-white">
        <RAEHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <RAEFooter />
      </div>
    </LanguageProvider>
  );
}
