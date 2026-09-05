import type { ServiceResult } from "./service-error";
import { createServiceError, successResult, failureResult } from "./service-error";

export interface UploadConfig {
  maxSizeBytes: number;
  allowedMimeTypes: readonly string[];
}

export interface UploadResult {
  url: string;
  fileId: string;
  fileName: string;
  mimeType: string;
  size: number;
}

const DEFAULT_UPLOAD_CONFIGS: Record<string, UploadConfig> = {
  profileImage: { maxSizeBytes: 2_097_152, allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  eventImage: { maxSizeBytes: 5_242_880, allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  attachment: { maxSizeBytes: 10_485_760, allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"] },
  gallery: { maxSizeBytes: 15_728_640, allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] },
};

export function getUploadConfig(category: string): UploadConfig | undefined {
  return DEFAULT_UPLOAD_CONFIGS[category];
}

export function validateFile(file: { name: string; size: number; type: string }, category: string): ServiceResult<void> {
  const config = DEFAULT_UPLOAD_CONFIGS[category];
  if (!config) {
    return failureResult(createServiceError("VALIDATION_ERROR", `Unknown upload category: ${category}`));
  }
  if (file.size > config.maxSizeBytes) {
    return failureResult(
      createServiceError("VALIDATION_ERROR", `File exceeds maximum size of ${Math.round(config.maxSizeBytes / 1_048_576)} MB`),
    );
  }
  if (!config.allowedMimeTypes.includes(file.type)) {
    return failureResult(
      createServiceError("VALIDATION_ERROR", `File type ${file.type} is not allowed for ${category}`),
    );
  }
  return successResult(undefined);
}

export async function uploadFile(
  file: File,
  category: string,
  uploadFn: (file: File, category: string) => Promise<ServiceResult<UploadResult>>,
): Promise<ServiceResult<UploadResult>> {
  const validation = validateFile(file, category);
  if (!validation.success) return validation;
  return uploadFn(file, category);
}