export function sortBy<T, K extends keyof T>(items: T[], key: K): T[] {
  return [...items].sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (va < vb) return -1;
    if (va > vb) return 1;
    return 0;
  });
}

export function sortByDesc<T, K extends keyof T>(items: T[], key: K): T[] {
  return sortBy(items, key).reverse();
}

export function sortByMultiple<T>(items: T[], ...keys: Array<keyof T>): T[] {
  return [...items].sort((a, b) => {
    for (const key of keys) {
      const va = a[key];
      const vb = b[key];
      if (va < vb) return -1;
      if (va > vb) return 1;
    }
    return 0;
  });
}

export function sortByDate<T extends Record<string, unknown>>(items: T[], key: keyof T): T[] {
  return [...items].sort((a, b) => {
    const da = new Date(a[key] as string | number | Date).getTime();
    const db = new Date(b[key] as string | number | Date).getTime();
    return da - db;
  });
}

export function sortByString<T extends Record<string, unknown>>(items: T[], key: keyof T): T[] {
  return [...items].sort((a, b) => String(a[key]).localeCompare(String(b[key])));
}

export function sortByNumber<T extends Record<string, unknown>>(items: T[], key: keyof T): T[] {
  return [...items].sort((a, b) => Number(a[key]) - Number(b[key]));
}