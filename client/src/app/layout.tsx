import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { SkipLink } from "@/components/layout/skip-link";
import { StoreHydrator } from "@/stores/store-hydrator";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | JJCET Alumni",
    default: "JJCET Alumni",
  },
  description:
    "JJCET Alumni Association — Connecting alumni, fostering networks, and building community.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "JJCET Alumni",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get("csrf_token")?.value ?? undefined;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <StoreHydrator csrfToken={csrfToken}>
          <SkipLink />
          {children}
        </StoreHydrator>
        <Toaster richColors closeButton position="bottom-right" />
      </body>
    </html>
  );
}
