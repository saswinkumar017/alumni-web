import { sanitizeHtml as _sanitizeHtml, sanitizeUrl as _sanitizeUrl } from "@/lib/utils/security";
import { truncate as _truncate } from "@/lib/utils/string";

export { _sanitizeHtml as sanitizeHtml, _sanitizeUrl as sanitizeUrl };
export { _truncate as truncate };

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = _sanitizeHtml(value);
    } else if (Array.isArray(value)) {
      result[key] = value;
    } else if (value !== null && typeof value === "object") {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}
