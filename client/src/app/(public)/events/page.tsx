import type { Metadata } from "next";
import { EventsList } from "@/features/events";

export const metadata: Metadata = {
  title: "Events",
  description: "Stay connected with upcoming and past alumni events.",
  openGraph: {
    title: "Events — JJCET Alumni",
    description: "Browse upcoming and past alumni events.",
  },
};

export default function EventsPage() {
  return <EventsList />;
}
