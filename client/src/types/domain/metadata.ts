import type { UserId } from "./branded";

export interface Timestamped {
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SoftDeletable extends Timestamped {
  readonly deletedAt: string | null;
}

export interface Authored {
  readonly createdBy: UserId;
}
