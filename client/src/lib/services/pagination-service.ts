import type { PaginatedResponse } from "@/types/shared";

export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPrevPage: boolean;
}
export function getPaginationMeta<T>(response: PaginatedResponse<T>): PaginationMeta {
  return {
    page: response.page,
    limit: response.pageSize,
    total: response.total,
    totalPages: response.totalPages,
    hasNextPage: response.page < response.totalPages,
    hasPrevPage: response.page > 1,
  };
}

export function getPageRange(current: number, total: number, siblingCount = 1): (number | "...")[] {
  const totalPageNumbers = siblingCount * 2 + 5;
  if (totalPageNumbers >= total) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(current - siblingCount, 1);
  const rightSiblingIndex = Math.min(current + siblingCount, total);

  const showLeftDots = leftSiblingIndex > 2;
  const showRightDots = rightSiblingIndex < total - 1;

  if (!showLeftDots && showRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, "...", total];
  }

  if (showLeftDots && !showRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from({ length: rightItemCount }, (_, i) => total - rightItemCount + i + 1);
    return [1, "...", ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i,
  );
  return [1, "...", ...middleRange, "...", total];
}

export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
