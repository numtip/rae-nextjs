import type { Metadata } from "next";
import HeroSection from "@/components/rae/sections/HeroSection";
import AnnouncementTicker from "@/components/rae/sections/AnnouncementTicker";
import QuickServicesGrid from "@/components/rae/sections/QuickServicesGrid";
import ResearchShowcase from "@/components/rae/sections/ResearchShowcase";
import KPIBlock from "@/components/rae/sections/KPIBlock";
import NewsSection from "@/components/rae/sections/NewsSection";
import AudienceNav from "@/components/rae/sections/AudienceNav";

export const metadata: Metadata = {
  title: "RAE — Research Academy of Excellence | ศูนย์ความเป็นเลิศด้านการวิจัย",
  description:
    "Leading research and innovation in Thailand. Advancing knowledge and accelerating impact in life sciences, AI, sustainability, and social innovation.",
  openGraph: {
    title: "RAE — Research Academy of Excellence",
    description: "Advancing Knowledge. Accelerating Impact.",
    type: "website",
  },
};

/**
 * RAE Institutional Homepage.
 * Renders all sections in order: Hero → Ticker → Services → Research → KPI → News → Audience.
 * Layout (header/footer) is provided by (rae)/layout.tsx.
 */
export default function RAEHomePage() {
  return (
    <>
      {/* 1. Hero — Full viewport navy gradient */}
      <HeroSection />

      {/* 2. Announcement Ticker */}
      <AnnouncementTicker />

      {/* 3. Quick Services Grid (8 tiles) */}
      <QuickServicesGrid />

      {/* 4. Research Showcase (4 areas) */}
      <ResearchShowcase />

      {/* 5. KPI / Impact Block */}
      <KPIBlock />

      {/* 6. News & Events */}
      <NewsSection />

      {/* 7. Audience-Based Navigation */}
      <AudienceNav />
    </>
  );
}
