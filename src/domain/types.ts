export type IsoDate = string; // YYYY-MM-DD

export interface EntityRef {
  path: string;
  name: string;
}

export const CLIENT_STATUSES = ["active", "inactive", "archived"] as const;
export const PROJECT_STATUSES = [
  "active",
  "paused",
  "completed",
  "archived",
] as const;
export const PRIORITIES = ["low", "medium", "high", "critical"] as const;

export const TASK_STATUSES = [
  "not-started",
  "in-progress",
  "blocked",
  "complete",
  "cancelled",
] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
