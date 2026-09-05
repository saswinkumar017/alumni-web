export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-().]/g, "").replace(/^\+?1?/, "");
}

export function normalizeUrl(url: string): string {
  let normalized = url.trim().toLowerCase();
  if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
  return normalized.replace(/\/+$/, "");
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}