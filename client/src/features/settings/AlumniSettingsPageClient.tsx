"use client";

import { useEffect, useState } from "react";
import { AlumniSettings } from "@/features/settings";
import { useAuthStore } from "@/stores/global/auth-store";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/types";

interface AlumniSettingsPageClientProps {
  user: SessionUser;
}

export function AlumniSettingsPageClient({ user }: AlumniSettingsPageClientProps) {
  const router = useRouter();
  const { status } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [mounted, status, router]);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var token = localStorage.getItem('accessToken');
                if (token) {
                  var parts = token.split('.');
                  if (parts.length === 3) {
                    var payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                    if (payload.exp && Date.now() >= payload.exp * 1000) {
                      localStorage.removeItem('accessToken');
                      localStorage.removeItem('refreshToken');
                      localStorage.removeItem('user');
                    }
                  }
                }
              } catch (e) {}
            })();
          `,
        }}
      />
      {!mounted && (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500">
          Loading settings...
        </div>
      )}
      {status === "loading" && (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500">
          Loading settings...
        </div>
      )}
      {status === "idle" && (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500">
          Loading settings...
        </div>
      )}
      {status === "unauthenticated" && null}
      {!mounted && !status && !status && (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500">
          Loading settings...
        </div>
      )}
      {status === "authenticated" && mounted && (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var token = localStorage.getItem('accessToken');
                    if (token) {
                      var parts = token.split('.');
                      if (parts.length === 3) {
                        var payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                        if (payload.exp && Date.now() >= payload.exp * 1000) {
                          localStorage.removeItem('accessToken');
                          localStorage.removeItem('refreshToken');
                          localStorage.removeItem('user');
                        }
                      }
                    }
                  } catch (e) {}
                })();
              `,
            }}
          />
          <AlumniSettings user={user} />
        </>
      )}
    </>
  );
}