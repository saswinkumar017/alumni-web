export function parseDate(value: string | number | Date): Date {
  if (value instanceof Date) return new Date(value.getTime());
  return new Date(value);
}

export function parseDateSafe(value: string | number | Date | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value.getTime());
  if (typeof value === "string" && value.trim().length === 0) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}