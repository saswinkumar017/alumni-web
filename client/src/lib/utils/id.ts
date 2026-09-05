export type BrandedId<T extends string> = string & { __brand: T };

export function createId<T extends string>(prefix: T): BrandedId<T> {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${timestamp}${random}` as BrandedId<T>;
}

export function idEquals<T extends string>(a: BrandedId<T> | string, b: BrandedId<T> | string): boolean {
  return a === b;
}

export function idToString<T extends string>(id: BrandedId<T>): string {
  return id;
}

export function isValidId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}