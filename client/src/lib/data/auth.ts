import { redirect } from "next/navigation";
import type { SessionUser, UserRole } from "@/types";
import type { Result } from "./types";
import { apiClient } from "./instance";
import { env } from "@/config/env";

export { setTokenProvider, setAuthFailureHandler, setTokenRefreshHandler } from "./instance";

export async function getCurrentUser(signal?: AbortSignal): Promise<Result<SessionUser>> {
  return apiClient.get<SessionUser>("/profile", {
    signal,
    cache: {
      tags: ["auth:me"],
      ttlMs: 5 * 60 * 1000,
      staleWhileRevalidate: true,
    },
  });
}

export async function getServerUser(cookieHeader: string): Promise<SessionUser | null> {
  try {
    const token = cookieHeader
      .split("; ")
      .find((c) => c.startsWith("session_token="))
      ?.split("=")
      .slice(1)
      .join("=");

    if (!token) return null;

    const res = await fetch(`${env.api.baseUrl}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      id: data.userId,
      name: data.fullName || data.username,
      email: data.email,
      role: data.role?.toLowerCase() || "user",
      avatar: null,
    } as SessionUser;
  } catch {
    return null;
  }
}

export function requireRole(user: SessionUser | null, allowedRoles: readonly UserRole[]): void {
  if (!user) {
    redirect("/auth/login");
  }
  if (!allowedRoles.includes(user.role)) {
    redirect("/alumni/dashboard");
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const user = await getServerUser(cookieHeader);
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}


