export function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj } as Record<string, unknown>;
  for (const key of keys) delete result[key as string];
  return result as Omit<T, K>;
}

export function renameKey<T extends Record<string, unknown>>(obj: T, from: string, to: string): Record<string, unknown> {
  const result = { ...obj } as Record<string, unknown>;
  if (from in result) {
    result[to] = result[from];
    delete result[from];
  }
  return result;
}

export function mapKeys<T extends Record<string, unknown>>(obj: T, fn: (key: string) => string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[fn(key)] = value;
  }
  return result;
}

export function mapValues<T extends Record<string, unknown>, U>(obj: T, fn: (value: unknown, key: string) => U): Record<string, U> {
  const result: Record<string, U> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = fn(value, key);
  }
  return result;
}

export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target } as Record<string, unknown>;
  for (const key of Object.keys(source)) {
    const val = source[key as keyof typeof source];
    if (isPlainObject(val) && isPlainObject(result[key])) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, val as Record<string, unknown>);
    } else if (val !== undefined) {
      result[key] = val;
    }
  }
  return result as T;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.prototype.toString.call(value) === "[object Object]";
}

export function isEmptyObject(value: unknown): boolean {
  return isPlainObject(value) && Object.keys(value).length === 0;
}

export function hasKey<T extends Record<string, unknown>>(obj: T, key: PropertyKey): key is keyof T {
  return key in obj;
}

export function getNested<T = unknown>(obj: Record<string, unknown>, path: string, defaultValue?: T): T | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return defaultValue;
    current = (current as Record<string, unknown>)[key];
  }
  return (current as T) ?? defaultValue;
}

export function setNested<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const result = { ...obj } as Record<string, unknown>;
  let current: Record<string, unknown> = result;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]!] = value;
  return result as T;
}

export function toRecord<K extends string | number | symbol, V>(
  items: V[],
  keyFn: (item: V) => K,
): Record<K, V> {
  const result = {} as Record<K, V>;
  for (const item of items) result[keyFn(item)] = item;
  return result;
}

export function toMap<K, V>(items: V[], keyFn: (item: V) => K): Map<K, V> {
  const map = new Map<K, V>();
  for (const item of items) map.set(keyFn(item), item);
  return map;
}

export function uniqBy<T, K>(items: T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function partition<T>(items: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];
  for (const item of items) (predicate(item) ? pass : fail).push(item);
  return [pass, fail];
}

export function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

export function intersection<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter((item) => setB.has(item));
}

export function difference<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter((item) => !setB.has(item));
}

export function toggleItem<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items.filter((i) => i !== item) : [...items, item];
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const result = [...items];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed!);
  return result;
}

export function updateItem<T, K extends keyof T>(items: T[], key: K, value: T[K], update: Partial<T>): T[] {
  return items.map((item) => (item[key] === value ? { ...item, ...update } : item));
}

export function groupBy<T, K extends string | number | symbol>(items: T[], keyFn: (item: T) => K): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}