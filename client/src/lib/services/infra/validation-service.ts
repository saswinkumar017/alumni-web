import type { ServiceResult } from "./service-error";
import { createServiceError, successResult, failureResult } from "./service-error";

export interface ValidationRule<T> {
  validate(input: T): string | null;
  field?: string;
}

export async function validateInput<T>(
  input: T,
  rules: readonly ValidationRule<T>[],
): Promise<ServiceResult<T>> {
  const errors: { field: string | undefined; message: string }[] = [];
  for (const rule of rules) {
    const error = rule.validate(input);
    if (error) {
      errors.push({ field: rule.field, message: error });
    }
  }
  if (errors.length > 0) {
    return failureResult(
      createServiceError(
        "VALIDATION_ERROR",
        errors.map((e) => e.message).join("; "),
        undefined,
        errors[0]?.field,
      ),
    );
  }
  return successResult(input);
}

export function createMinLengthRule(min: number, field?: string): ValidationRule<string> {
  return {
    field,
    validate(input: string): string | null {
      return input.length >= min ? null : `Must be at least ${min} characters`;
    },
  };
}

export function createMaxLengthRule(max: number, field?: string): ValidationRule<string> {
  return {
    field,
    validate(input: string): string | null {
      return input.length <= max ? null : `Must be at most ${max} characters`;
    },
  };
}

export function createRequiredRule(field?: string): ValidationRule<unknown> {
  return {
    field,
    validate(input: unknown): string | null {
      if (input === null || input === undefined) return "This field is required";
      if (typeof input === "string" && input.trim().length === 0) return "This field is required";
      return null;
    },
  };
}

export function createEmailRule(field?: string): ValidationRule<string> {
  return {
    field,
    validate(input: string): string | null {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(input) ? null : "Invalid email format";
    },
  };
}

export function createPatternRule(pattern: RegExp, message: string, field?: string): ValidationRule<string> {
  return {
    field,
    validate(input: string): string | null {
      return pattern.test(input) ? null : message;
    },
  };
}