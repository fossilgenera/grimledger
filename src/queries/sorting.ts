import { PRIORITIES, Priority } from "../domain/types";

/** Case-insensitive text comparison. Returns a negative, zero or positive number. */
export function compareText(a: string, b: string): number {
    const left = a.toLowerCase();
    const right = b.toLowerCase();
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
}

/** Orders priorities from hightest (critical) to lowest (low). */
export function comparePriorityDescending(a: Priority, b: Priority): number {
    return PRIORITIES.indexOf(b) - PRIORITIES.indexOf(a);
}