import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlumniRecordDetail } from "@/features/alumni-mgmt";
import { requireAuth, requireRole } from "@/lib/data/auth";
import { validateId } from "@/lib/route-params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alumni Record",
  description: "View and manage an alumni record.",
  robots: { index: false, follow: false },
};

export default async function AdminAlumniDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  requireRole(user, ["admin"]);

  const { id } = await params;
  const validated = validateId(id);
  if (!validated) notFound();

  return <AlumniRecordDetail id={validated} user={user} />;
}
