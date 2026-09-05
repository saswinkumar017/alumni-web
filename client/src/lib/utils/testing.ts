export function range(start: number, end: number, step = 1): number[] {
  const result: number[] = [];
  for (let i = start; i < end; i += step) result.push(i);
  return result;
}

export function repeat<T>(value: T, count: number): T[] {
  return Array.from({ length: count }, () => value);
}

export function createMockUser(overrides?: Record<string, unknown>): Record<string, unknown> {
  return { id: "user_1", name: "Test User", email: "test@example.com", role: "student", ...overrides };
}

export function createMockAlumni(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: "alumni_1", name: "Alumni Test", email: "alumni@example.com",
    graduationYear: 2020, department: "CSE", ...overrides,
  };
}

export function createMockEvent(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: "event_1", title: "Test Event", description: "Test description",
    date: "2026-01-15", location: "Campus", ...overrides,
  };
}

export function createMockJob(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: "job_1", title: "Software Engineer", company: "Tech Corp",
    location: "Remote", type: "full-time", ...overrides,
  };
}