import { WorkSession } from "../models/workSession";
import type { EntityRef, IsoDate } from "../types";

/** The time a daily note says was spent on a task that day. */
export interface DesiredTime {
  task: EntityRef;
  minutes: number;
}

/**
 * Adds up the wanted time for the same task, for when one has several headings in a day.
 * Keeps first-seen order and never changes its input.
 */
export function mergeDesired(items: readonly DesiredTime[]): DesiredTime[] {
  const byPath = new Map<string, DesiredTime>();
  for (const item of items) {
    const existing = byPath.get(item.task.path);
    if (existing === undefined) {
      byPath.set(item.task.path, { task: item.task, minutes: item.minutes });
    } else {
      existing.minutes += item.minutes;
    }
  }
  return [...byPath.values()];
}

export type TimeSyncAction =
  | { kind: "create"; task: EntityRef; minutes: number }
  | { kind: "update"; session: WorkSession; minutes: number }
  | { kind: "unchanged"; task: EntityRef; minutes: number }
  | {
      kind: "conflict";
      task: EntityRef;
      wanted: number;
      existing: number;
      sessionCount: number;
    };

/**
 * Decides what to do for each wanted time. The key is task plus date, and the wanted time
 * is absolute, so running the plan twice gives the same result.
 *
 * - no session that day: create one
 * - sessions already add up to the wanted time: leave them alone
 * - exactly one session with a different time: change its minutes
 * - several sessions with a different total: report a conflict, change nothing
 */
export function planTimeSync(
  desired: readonly DesiredTime[],
  sessions: readonly WorkSession[],
  date: IsoDate,
): TimeSyncAction[] {
  return desired.map((item): TimeSyncAction => {
    const matching = sessions.filter(
      (session) =>
        session.date === date && session.task.path === item.task.path,
    );
    if (matching.length === 0) {
      return { kind: "create", task: item.task, minutes: item.minutes };
    }

    const existing = matching.reduce(
      (total, session) => total + session.minutes,
      0,
    );
    if (existing === item.minutes) {
      return { kind: "unchanged", task: item.task, minutes: item.minutes };
    }

    const only = matching[0];
    if (matching.length === 1 && only !== undefined) {
      return { kind: "update", session: only, minutes: item.minutes };
    }
    return {
      kind: "conflict",
      task: item.task,
      wanted: item.minutes,
      existing,
      sessionCount: matching.length,
    };
  });
}
