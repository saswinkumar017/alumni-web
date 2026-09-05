"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/global/auth-store";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { developerNavigation } from "@/config/navigation";
import { clearAuthTokens } from "@/features/auth/_services/auth-api";

export default function DeveloperLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (status === "authenticated" && user && user.role !== "developer") {
      router.push("/admin/dashboard");
    }
  }, [user, status, router]);

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-400" />
      </div>
    );
  }

  if (!user || user.role !== "developer") {
    return null;
  }

  function handleSignOut() {
    clearAuthTokens();
    logout();
    router.push("/");
  }

  return (
    <AuthenticatedShell
      navGroups={developerNavigation}
      title="Developer Portal"
      branding="Developer"
      brandingHref="/developer"
      onSignOut={handleSignOut}
    >
      {children}
    </AuthenticatedShell>
  );
}
