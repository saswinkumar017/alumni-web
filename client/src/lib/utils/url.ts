export function buildUrl(base: string, params?: Record<string, string | number | boolean | null | undefined>): string {
  const url = new URL(base, typeof window !== "undefined" ? window.location.origin : undefined);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== "") url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function getQueryParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

export function getQueryParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

export function setQueryParam(key: string, value: string): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  return url.toString();
}

export function removeQueryParam(key: string): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.searchParams.delete(key);
  return url.toString();
}

export function isExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url, typeof window !== "undefined" ? window.location.origin : undefined);
    if (typeof window === "undefined") return parsed.host !== "";
    return parsed.host !== window.location.host;
  } catch {
    return false;
  }
}