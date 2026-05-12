"use client";

import { LanguageProvider } from "@/components/rae/hooks/useLanguage";
import RAEHeader from "@/components/rae/layout/RAEHeader";
import RAEFooter from "@/components/rae/layout/RAEFooter";

/**
 * RAE dedicated route layout at /rae.
 * Provides LanguageProvider context + sticky header + footer.
 */
export default function RAERouteLayout({
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
"use client";

import { LanguageProvider } from "@/components/rae/hooks/useLanguage";
import RAEHeader from "@/components/rae/layout/RAEHeader";
import RAEFooter from "@/components/rae/layout/RAEFooter";

/**
 * RAE dedicated route layout at /rae.
 * Provides LanguageProvider context + sticky header + footer.
 */
export default function RAERouteLayout({
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
