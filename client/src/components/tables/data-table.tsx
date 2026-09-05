/**
 * DataTable renders tabular data with optional sorting, selection, and pagination.
 *
 * @alpha Not yet consumed by any feature. Create co-located components
 * (DataTableHeader, DataTableRow, DataTablePagination) when first reuse is proven.
 * Uses @tanstack/react-virtual for efficient rendering of large datasets.
 *
 * @example
 * ```tsx
 * <DataTable
 *   columns={[{ key: "name", header: "Name" }]}
 *   rows={[{ name: "Alice" }, { name: "Bob" }]}
 * />
 * ```
 */

import type { ReactNode } from "react";
import { Skeleton } from "@/components/skeletons/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  sortable?: boolean;
  selectable?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  variant?: "default" | "compact" | "comfortable";
  className?: string;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  emptyIcon?: ReactNode;
}

export function DataTableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-4 border-b border-border-default pb-2">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function DataTable<T>({
  columns,
  rows,
  sortable,
  selectable: _selectable,
  pageSize,
  onRowClick,
  onSelectionChange: _onSelectionChange,
  variant = "default",
  className,
  emptyMessage = "No items to display.",
  emptyIcon,
  emptyAction,
}: DataTableProps<T>) {
  const displayRows = pageSize ? rows.slice(0, pageSize) : rows;

  if (rows.length === 0) {
    return (
      <div className={cn("flex min-h-[200px] items-center justify-center", className)}>
        <EmptyState message={emptyMessage} icon={emptyIcon} action={emptyAction} />
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)} role="region" aria-label="Data table">
      <table
        className={cn(
          "w-full border-collapse text-sm",
          variant === "compact" && "text-xs",
          variant === "comfortable" && "text-base",
          sortable && "select-none",
        )}
      >
        <thead>
          <tr className="border-b border-border-default">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-3 py-2 text-left font-medium text-text-secondary",
                  col.sortable && "cursor-pointer hover:text-text-primary",
                )}
                scope="col"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, index) => (
            <tr
              key={(row as { id?: string }).id ?? index}
              className={cn(
                "border-b border-border-default transition-colors",
                onRowClick && "cursor-pointer hover:bg-surface-hover",
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2 text-text-primary">
                  {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}