import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NetworkingList } from "@/features/networking";
import { getCurrentUser } from "@/lib/data/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Networking",
  description: "Connect with fellow alumni.",
  robots: { index: false, follow: false },
};

export default async function AlumniNetworkingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return <NetworkingList />;
}
