import type { Metadata } from "next";
import { HeroSection } from "@/sections/hero-section";
import { StatsSection } from "@/sections/stats-section";
import { AboutSection } from "@/sections/about-section";
import { EventsSection } from "@/sections/events-section";
import { SuccessStoriesSection } from "@/sections/success-stories-section";
import { DepartmentsSection } from "@/sections/departments-section";
import { CTASection } from "@/sections/cta-section";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Home",
  description:
    "JJCET Alumni Association — Connecting alumni, fostering networks, and building community for generations to come.",
  openGraph: {
    title: "JJCET Alumni Association",
    description:
      "Connecting alumni, fostering networks, and building a stronger community for generations to come.",
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <AboutSection />
      <EventsSection />
      <SuccessStoriesSection />
      <DepartmentsSection />
      <CTASection />
    </>
  );
}
