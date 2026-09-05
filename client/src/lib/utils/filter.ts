export function filterBySearch<T>(items: T[], search: string, keys: Array<keyof T>): T[] {
  if (!search.trim()) return items;
  const query = search.toLowerCase();
  return items.filter((item) =>
    keys.some((key) => {
      const value = item[key];
      return String(value).toLowerCase().includes(query);
    }),
  );
}

export function composeFilters<T>(...filters: Array<(items: T[]) => T[]>): (items: T[]) => T[] {
  return (items: T[]) => filters.reduce((acc, filter) => filter(acc), items);
}