"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/global/auth-store";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { alumniNavigation } from "@/config/navigation";
import { clearAuthTokens } from "@/features/auth/_services/auth-api";

export default function AlumniLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (user?.role === "developer") {
      router.replace("/developer");
    }
  }, [user?.role, router]);

  function handleSignOut() {
    clearAuthTokens();
    logout();
    router.push("/");
  }

  if (user?.role === "developer") {
    return null;
  }

  return (
    <AuthenticatedShell
      navGroups={alumniNavigation}
      title="Alumni Portal"
      branding="JJCET Alumni"
      brandingHref="/alumni/dashboard"
      onSignOut={handleSignOut}
    >
      {children}
    </AuthenticatedShell>
  );
}
