import type { Task } from "../models/task";
import { fail, ok, type Result } from "../result";
import type { EntityRef, IsoDate, Priority } from "../types";
import { nextDueDate, nextOccurrenceName, type Recurrence } from "./recurrence";

/** The next copy of a repeating task. Only the name and due date change. */
export interface NextOccurrence {
  project: EntityRef;
  name: string;
  priority: Priority;
  due: IsoDate;
  estimatedMinutes: number | undefined;
  recurrence: Recurrence;
}

/**
 * Plans the next occurrence of a task being completed. Returns nothing for a task that does not repeat, and
 * a failure for one that repeats but has no due date, becausethere is nothing to count from.
 */
export function nextOccurrence(
  task: Task,
  today: IsoDate,
): Result<NextOccurrence | undefined> {
  if (task.recurrence === undefined) {
    return ok(undefined);
  }
  if (task.due === undefined) {
    return fail(
      `"${task.name}" repeats, but this occurrence has no due date, so the next one cannot be scheduled. Add a due date to it, then complete it again.`,
    );
  }
  const due = nextDueDate(task.due, task.recurrence, today);
  return ok({
    project: task.project,
    name: nextOccurrenceName(task.name, due),
    priority: task.priority,
    due,
    estimatedMinutes: task.estimatedMinutes,
    recurrence: task.recurrence,
  });
}
