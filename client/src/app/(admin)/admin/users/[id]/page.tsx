import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserDetail } from "@/features/users";
import { requireAuth, requireRole } from "@/lib/data/auth";
import { validateId } from "@/lib/route-params";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "User Details",
  description: "View and manage user details.",
  robots: { index: false, follow: false },
};

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  requireRole(user, ["admin"]);

  const { id } = await params;
  const validated = validateId(id);
  if (!validated) notFound();

  return <UserDetail id={validated} user={user} />;
}
