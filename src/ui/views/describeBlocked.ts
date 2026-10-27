import type { Task } from "../../domain/models/task";
import { daysBetween } from "../../domain/rules/isoDate";
import type { IsoDate } from "../../domain/types";
import { describeDue } from "./describeDue";

function reasonOf(task: Task): string {
    if (task.waitingOn !== undefined) {
        return task.blockedBy === undefined
            ? `Waiting on ${task.waitingOn}`
            : `Waiting on ${task.waitingOn} (${task.blockedBy})`;
    }
    if (task.blockedBy !== undefined) {
        return `Blocked by ${task.blockedBy}`;
    }
    return "No reason given";
}

function durationOf(task: Task, today: IsoDate): string {
    if (task.blockedSince === undefined) {
        return "";
    }
    // A start date in the future (manually edited) counts as today, never negative.
    const days = Math.max(0, daysBetween(task.blockedSince, today));
    if (days ===0) return "Blocked today";
    return days === 1 ? "Blocked for 1 day" : `Blocked for ${days} days`;
}

/** The lines shown under a blocked task on the dashboard. Empty lines are left out. */
export function describeBlocked(task: Task, today: IsoDate): string[] {
    const lines = [reasonOf(task), durationOf(task, today)];
    if (task.expectedResolution !== undefined) {
        lines.push(`Expected: ${describeDue(task.expectedResolution, today)}`);
    }
    return lines.filter((line) => line !== "");
}