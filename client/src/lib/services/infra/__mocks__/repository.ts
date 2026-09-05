import type { ServiceResult } from "../service-error";
import { successResult, failureResult, createServiceError } from "../service-error";

export function mockSuccessResult<T>(data: T): ServiceResult<T> {
  return successResult(data);
}

export function mockFailureResult<T>(code: "NOT_FOUND" | "AUTHORIZATION_ERROR" | "VALIDATION_ERROR" | "SERVER_ERROR" | "CONFLICT"): ServiceResult<T> {
  return failureResult(createServiceError(code, `Mock ${code.toLowerCase().replace(/_/g, " ")}`));
}

export function createMockRepository<T>(initialData: readonly T[]) {
  let data = [...initialData];
  return {
    getAll: async (): Promise<ServiceResult<readonly T[]>> => successResult([...data]),
    getById: async (id: string, idSelector: (item: T) => string): Promise<ServiceResult<T>> => {
      const item = data.find((d) => idSelector(d) === id);
      return item ? successResult(item) : mockFailureResult("NOT_FOUND");
    },
    create: async (item: T): Promise<ServiceResult<T>> => {
      data.push(item);
      return successResult(item);
    },
    update: async (id: string, updates: Partial<T>, idSelector: (item: T) => string): Promise<ServiceResult<T>> => {
      const index = data.findIndex((d) => idSelector(d) === id);
      if (index === -1) return mockFailureResult("NOT_FOUND");
      data[index] = { ...data[index], ...updates } as T;
      return successResult(data[index]);
    },
    delete: async (id: string, idSelector: (item: T) => string): Promise<ServiceResult<void>> => {
      const index = data.findIndex((d) => idSelector(d) === id);
      if (index === -1) return mockFailureResult("NOT_FOUND");
      data.splice(index, 1);
      return successResult(undefined);
    },
    reset: (newData: readonly T[]) => {
      data = [...newData];
    },
  };
}