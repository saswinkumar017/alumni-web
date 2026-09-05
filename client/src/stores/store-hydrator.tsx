"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { setCsrfToken } from "@/lib/security/csrf";
import { clearAllRateLimits } from "@/lib/security/rate-limit-client";
import { setTokenProvider } from "@/lib/data/auth";
import { useAuthStore } from "@/stores/global/auth-store";

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

interface StoreHydratorProps {
  children: ReactNode;
  csrfToken?: string;
}

export function StoreHydrator({ children, csrfToken }: StoreHydratorProps) {
  const hydrate = useAuthStore((s) => s.hydrate);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (csrfToken) {
      setCsrfToken(csrfToken);
    }
    clearAllRateLimits();

    setTokenProvider(async () => {
      return localStorage.getItem("accessToken");
    });

    // Hydrate auth state from localStorage
    const token = localStorage.getItem("accessToken");
    const userJson = localStorage.getItem("user");

    if (token && isTokenExpired(token)) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      document.cookie = "session_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      logout();
      return;
    }

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        hydrate(user);
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    }
  }, [csrfToken, hydrate, logout]);

  return <>{children}</>;
}
