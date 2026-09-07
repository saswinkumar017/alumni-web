import type { Metadata } from "next";
import { HeroSection } from "@/sections/hero-section";
import { AboutSection } from "@/sections/about-section";
import { WhyJoinSection } from "@/sections/why-join-section";
import { EventsSection } from "@/sections/events-section";
import { GallerySection } from "@/sections/gallery-section";
import { AlumniMeetSection } from "@/sections/alumni-meet-section";
import { ProminentAlumniSection } from "@/sections/prominent-alumni-section";
import { NewsletterSection } from "@/sections/newsletter-section";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Register At JJCET Alumni Portal For Great Networking & Opportunity",
  description:
    "Welcome to the Alumni Portal of JJCET — connect, collaborate, and continue to grow together.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <WhyJoinSection />
      <EventsSection />
      <GallerySection />
      <AlumniMeetSection />
      <ProminentAlumniSection />
      <NewsletterSection />
    </>
  );
}
