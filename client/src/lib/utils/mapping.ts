export function mapTo<T, U>(value: T, fn: (value: T) => U): U {
  return fn(value);
}

export function mapNullable<T, U>(value: T | null | undefined, fn: (value: T) => U): U | null | undefined {
  if (value == null) return value as null | undefined;
  return fn(value);
}