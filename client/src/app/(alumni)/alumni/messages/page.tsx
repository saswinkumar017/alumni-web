import type { Metadata } from "next";
import { MessagesInbox } from "@/features/messages";
import { requireAuth } from "@/lib/data/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Messages",
  description: "Your inbox and conversations.",
  robots: { index: false, follow: false },
};

export default async function AlumniMessagesPage() {
  const user = await requireAuth();

  return <MessagesInbox user={user} />;
}
