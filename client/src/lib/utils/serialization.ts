export function serialize<T>(value: T): string {
  return JSON.stringify(value);
}

export function deserialize<T>(value: string): T {
  return JSON.parse(value) as T;
}

export function safeDeserialize<T>(value: string, defaultValue: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}