export interface Report {
  readonly id: string;
  readonly title: string;
  readonly type: "user" | "event" | "job" | "system";
  readonly data: Record<string, unknown>;
  readonly generatedAt: string;
  readonly filters?: Record<string, unknown>;
}