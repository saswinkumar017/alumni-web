"use client";

import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { publicNavigation } from "@/config/navigation";
import { useAuthStore } from "@/stores/global/auth-store";

const PANEL_MAP: Record<string, { label: string; href: string }> = {
  admin: { label: "Admin Panel", href: "/admin/dashboard" },
  developer: { label: "Developer Panel", href: "/developer" },
  user: { label: "My Dashboard", href: "/alumni/dashboard" },
  alumni_lead: { label: "My Dashboard", href: "/alumni/dashboard" },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = useAuthStore((s) => s.user);
  const panel = user ? PANEL_MAP[user.role] ?? PANEL_MAP.user : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        >
          <Link href="/" className="text-xl font-bold text-zinc-900">
            JJCET Alumni
          </Link>
          <div className="hidden items-center gap-8 sm:flex">
            {publicNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                {item.label}
              </Link>
            ))}
            {user && panel ? (
              <div className="flex items-center gap-3">
                <Link
                  href={panel.href}
                  className="flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-solid text-xs font-bold text-white">
                    {user.name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                  {panel.label}
                </Link>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-full bg-accent-solid px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-solid-hover"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
