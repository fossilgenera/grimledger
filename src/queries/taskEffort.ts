import { WorkSession } from "../domain/models/workSession";

function compareStrings(a: string, b: string): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/** Sessions logged against one task, oldest first, ties broken by path. */
export function sessionsForTask(
    sessions: readonly WorkSession[],
    taskPath: string,
): WorkSession[] {
    return sessions
        .filter((session) => session.task.path === taskPath)
        .sort(
            (a, b) =>
                compareStrings(a.date, b.date) || compareStrings(a.path, b.path),
        );
}

/** Actual effort of a task: the sum of its sessions, in minutes. */
export function actualMinutes(
    sessions: readonly WorkSession[],
    taskPath: string,
): number {
    return sessions
        .filter((session) => session.task.path === taskPath)
        .reduce((total, session) => total + session.minutes, 0);
}