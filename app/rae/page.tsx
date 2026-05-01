import type { Metadata } from "next";
import dynamic from "next/dynamic";
import HeroSection from "@/components/rae/sections/HeroSection";
import AnnouncementTicker from "@/components/rae/sections/AnnouncementTicker";
import QuickServicesGrid from "@/components/rae/sections/QuickServicesGrid";
import KPIBlock from "@/components/rae/sections/KPIBlock";

const ResearchShowcase = dynamic(() => import("@/components/rae/sections/ResearchShowcase"));
const NewsSection = dynamic(() => import("@/components/rae/sections/NewsSection"));
const AudienceNav = dynamic(() => import("@/components/rae/sections/AudienceNav"));

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
 * RAE Institutional Homepage at /rae.
 * Section order: Hero → Ticker → Services → Research → KPI → News → Audience.
 */
export default function RAEPage() {
  return (
    <>
      <HeroSection />
      <AnnouncementTicker />
      <QuickServicesGrid />
      <ResearchShowcase />
      <KPIBlock />
      <NewsSection />
      <AudienceNav />
    </>
  );
}

