import type { Recurrence } from "../rules/recurrence";
import { EntityRef, IsoDate, Priority, TaskStatus } from "../types";

export interface Task extends EntityRef {
  project: EntityRef;
  status: TaskStatus;
  priority: Priority;
  due: IsoDate | undefined;
  estimatedMinutes: number | undefined;
  created: IsoDate;
  completed: IsoDate | undefined;
  outcome: string | undefined;
  /** Set while the task is blocked. */
  blockedSince: IsoDate | undefined;
  blockedBy: string | undefined;
  waitingOn: string | undefined;
  expectedResolution: IsoDate | undefined;
  /** Present when the task repeats. Set at creation. */
  recurrence: Recurrence | undefined;
}
