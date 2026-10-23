import type { Task } from "../models/task";
import { fail, ok, type Result } from "../result";
import type { IsoDate } from "../types";
import { applyStatusChange } from "./taskStatus";

export interface BlockDetails {
  /** What the task is waiting for. Required, so every block has a reason. */
  waitingOn: string;
  blockedBy?: string | undefined;
  since: IsoDate;
  expectedResolution?: IsoDate | undefined;
}

/** What a blocker history record needs, taken from a task that is leaving blocked. */
export interface ClosedBlocker {
  since: IsoDate;
  until: IsoDate;
  blockedBy: string | undefined;
  waitingOn: string | undefined;
}

function clean(text: string | undefined): string | undefined {
  const trimmed = text?.trim();
  return trimmed === undefined || trimmed === "" ? undefined : trimmed;
}

/**
 * Blocks a task. Status transition is checked first, by the same rule every other status
 * change uses. Returns a new task.
 */
export function blockTask(
  task: Task,
  details: BlockDetails,
  today: IsoDate,
): Result<Task> {
  const changed = applyStatusChange(task, "blocked", today);
  if (!changed.ok) {
    return changed;
  }

  const waitingOn = clean(details.waitingOn);
  if (waitingOn === undefined) {
    return fail("Say what the task is waiting on.");
  }
  if (details.since > today) {
    return fail("Blocked since cannot be in the future.");
  }
  if (
    details.expectedResolution !== undefined &&
    details.expectedResolution < details.since
  ) {
    return fail("Expected resolution cannot be before the blocked since date.");
  }

  return ok({
    ...changed.value,
    blockedSince: details.since,
    blockedBy: clean(details.blockedBy),
    waitingOn,
    expectedResolution: details.expectedResolution,
  });
}

/**
 * The history record for a blocked task about to leave the blocked status.
 * Returns undefined when there is nothing worth recording: the task is not blocked,
 * has no start date, or start date is after the end.
 */
export function closedBlocker(
  task: Task,
  until: IsoDate,
): ClosedBlocker | undefined {
  if (task.status !== "blocked" || task.blockedSince === undefined) {
    return undefined;
  }
  if (task.blockedSince > until) {
    return undefined;
  }
  return {
    since: task.blockedSince,
    until,
    blockedBy: task.blockedBy,
    waitingOn: task.waitingOn,
  };
}
