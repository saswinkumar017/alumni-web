export interface ApiError {
  readonly status: number;
  readonly code: string;
  readonly message: string;
  readonly details?: readonly string[];
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export type ValidationErrors = readonly ValidationError[];

export type AppError =
  | { readonly kind: "api"; readonly error: ApiError }
  | { readonly kind: "validation"; readonly errors: ValidationErrors }
  | { readonly kind: "network"; readonly message: string }
  | { readonly kind: "unknown"; readonly message: string };
