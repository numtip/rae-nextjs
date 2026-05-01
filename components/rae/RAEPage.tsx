"use client";

import { LanguageProvider } from "@/components/rae/hooks/useLanguage";
import RAEHeader from "@/components/rae/layout/RAEHeader";
import RAEFooter from "@/components/rae/layout/RAEFooter";
import HeroSection from "@/components/rae/sections/HeroSection";
import AnnouncementTicker from "@/components/rae/sections/AnnouncementTicker";
import QuickServicesGrid from "@/components/rae/sections/QuickServicesGrid";
import ResearchShowcase from "@/components/rae/sections/ResearchShowcase";
import NewsSection from "@/components/rae/sections/NewsSection";
import KPIBlock from "@/components/rae/sections/KPIBlock";
import AudienceNav from "@/components/rae/sections/AudienceNav";

/**
 * RAE Institutional Template — Root page assembly.
 * Wraps all sections with LanguageProvider for bilingual (TH/EN) context.
 * 
 * Usage: import this as your page component in Next.js app router.
 * File: app/page.tsx or app/(rae)/page.tsx
 */
export default function RAEInstitutionalPage() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-white" lang="th">
        {/* Sticky Navigation Header */}
        <RAEHeader />

        <main id="main-content">
          {/* 1. Hero Section — Full viewport */}
          <HeroSection />

          {/* 2. Announcement Ticker */}
          <AnnouncementTicker />

          {/* 3. Quick Services Grid */}
          <QuickServicesGrid />

          {/* 4. Research Showcase */}
          <ResearchShowcase />

          {/* 5. KPI / Impact Block */}
          <KPIBlock />

          {/* 6. News & Events */}
          <NewsSection />

          {/* 7. Audience-Based Navigation */}
          <AudienceNav />
        </main>

        {/* Footer Knowledge Hub */}
        <RAEFooter />
      </div>
    </LanguageProvider>
  );
}
