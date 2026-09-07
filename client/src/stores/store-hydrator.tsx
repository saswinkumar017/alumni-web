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
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized));
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

// 15 min idle lockout (matches 900s access-token lifetime)
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;
const LAST_ACTIVITY_KEY = "lastActivity";

function clearClientSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  document.cookie = "session_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
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
      clearClientSession();
      logout();
      return;
    }

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        hydrate(user);
      } catch {
        clearClientSession();
      }
    }

    // Inactivity lockout: any interaction bumps lastActivity; idle past the
    // limit clears the session so an abandoned tab never stays logged in.
    const touch = () => {
      if (localStorage.getItem("accessToken")) {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      }
    };
    const checkIdle = () => {
      const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) ?? Date.now());
      if (localStorage.getItem("accessToken") && Date.now() - last > INACTIVITY_LIMIT_MS) {
        clearClientSession();
        logout();
      }
    };
    touch();
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    for (const e of events) window.addEventListener(e, touch, { passive: true });
    const idleTimer = window.setInterval(checkIdle, 60_000);
    return () => {
      for (const e of events) window.removeEventListener(e, touch);
      window.clearInterval(idleTimer);
    };
  }, [csrfToken, hydrate, logout]);

  return <>{children}</>;
}
