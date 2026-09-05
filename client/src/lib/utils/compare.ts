export function stringComparator(a: string, b: string): number {
  return a.localeCompare(b);
}

export function numberComparator(a: number, b: number): number {
  return a - b;
}

export function dateComparator(a: Date, b: Date): number {
  return a.getTime() - b.getTime();
}

export function booleanComparator(a: boolean, b: boolean): number {
  return Number(a) - Number(b);
}

export function nullSafeComparator<T>(a: T | null | undefined, b: T | null | undefined, comparator: (a: T, b: T) => number): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return comparator(a, b);
}