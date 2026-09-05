export function sanitizeHtml(dirty: string): string {
  return dirty
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return "";
  const allowed = url.trim().toLowerCase();
  if (allowed.startsWith("javascript:") || allowed.startsWith("data:") || allowed.startsWith("vbscript:")) return "";
  return url.trim();
}

export function base64Encode(value: string): string {
  if (typeof btoa === "undefined") return Buffer.from(value).toString("base64");
  return btoa(value);
}

export function base64Decode(value: string): string {
  if (typeof atob === "undefined") return Buffer.from(value, "base64").toString("utf-8");
  return atob(value);
}