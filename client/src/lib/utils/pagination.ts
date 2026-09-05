export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function getPageMeta(total: number, page: number, pageSize: number): { totalPages: number; hasNext: boolean; hasPrev: boolean } {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function getPageRange(total: number, page: number, pageSize: number): { start: number; end: number } {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return { start, end };
}