export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function isOnline(): boolean {
  return isBrowser() ? navigator.onLine : true;
}

export function isReducedMotion(): boolean {
  if (!isBrowser()) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function getViewport(): { width: number; height: number } {
  if (!isBrowser()) return { width: 0, height: 0 };
  return { width: window.innerWidth, height: window.innerHeight };
}

export function scrollToTop(): void {
  if (!isBrowser()) return;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isBrowser()) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function getCookie(name: string): string | undefined {
  if (!isBrowser()) return undefined;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2] ?? "") : undefined;
}