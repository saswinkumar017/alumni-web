import type { ServiceResult } from "./service-error";
import { successResult, failureResult, createServiceError } from "./service-error";

export interface ShareData {
  title: string;
  text?: string;
  url: string;
}

export async function shareNative(data: ShareData): Promise<ServiceResult<void>> {
  if (typeof navigator === "undefined" || !navigator.share) {
    return failureResult(createServiceError("UNEXPECTED_ERROR", "Web Share API not supported"));
  }
  try {
    await navigator.share({ title: data.title, text: data.text, url: data.url });
    return successResult(undefined);
  } catch {
    return failureResult(createServiceError("UNEXPECTED_ERROR", "Share was cancelled or failed"));
  }
}

export function shareByCopyLink(url: string): ServiceResult<void> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    return successResult(undefined);
  } catch {
    return failureResult(createServiceError("UNEXPECTED_ERROR", "Failed to copy link"));
  }
}

export function buildShareUrl(baseUrl: string, slug: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${slug.replace(/^\//, "")}`;
}