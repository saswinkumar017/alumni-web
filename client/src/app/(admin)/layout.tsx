"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/global/auth-store";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { adminNavigation } from "@/config/navigation";
import { clearAuthTokens } from "@/features/auth/_services/auth-api";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  function handleSignOut() {
    clearAuthTokens();
    logout();
    router.push("/");
  }

  return (
    <AuthenticatedShell
      navGroups={adminNavigation}
      title="Administration"
      branding="Admin"
      brandingHref="/admin/dashboard"
      onSignOut={handleSignOut}
    >
      {children}
    </AuthenticatedShell>
  );
}
