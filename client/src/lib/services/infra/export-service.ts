import type { ServiceResult } from "./service-error";
import { createServiceError, successResult, failureResult } from "./service-error";

export type ExportFormat = "csv" | "json" | "pdf";

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
}

export function exportToJson<T>(data: readonly T[]): string {
  return JSON.stringify(data, null, 2);
}

export function exportToCsv<T extends Record<string, unknown>>(
  data: readonly T[],
  columns?: readonly (keyof T)[],
): string {
  if (data.length === 0) return "";
  const keys = (columns ?? Object.keys(data[0] as object)) as readonly (keyof T)[];
  const header = keys.join(",");
  const rows = data.map((row) =>
    keys.map((key) => {
      const value = row[key];
      const str = value == null ? "" : String(value);
      return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(","),
  );
  return [header, ...rows].join("\n");
}

export function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadExport<T extends Record<string, unknown>>(
  data: readonly T[],
  options: ExportOptions,
  columns?: readonly (keyof T)[],
): ServiceResult<void> {
  try {
    let content: string;
    let mimeType: string;
    switch (options.format) {
      case "json":
        content = exportToJson(data);
        mimeType = "application/json";
        break;
      case "csv":
        content = exportToCsv(data, columns);
        mimeType = "text/csv";
        break;
      default:
        return failureResult(createServiceError("VALIDATION_ERROR", `Unsupported format: ${options.format}`));
    }
    downloadBlob(content, options.filename, mimeType);
    return successResult(undefined);
  } catch {
    return failureResult(createServiceError("UNEXPECTED_ERROR", "Failed to generate export"));
  }
}