import { Task } from "../domain/models/task";
import { addDays } from "../domain/rules/isoDate";
import { IsoDate } from "../domain/types";
import { openTasks } from "./openTasks";
import { comparePriorityDescending, compareText } from "./sorting";

export const DEFAULT_UPCOMING_DAYS = 7;

function compareDue(a: Task, b: Task): number {
    return compareText(a.due ?? "", b.due ?? "");
}

function comparePriority(a: Task, b: Task): number {
    return comparePriorityDescending(a.priority, b.priority);
}

function comparePath(a: Task, b: Task): number {
    return compareText(a.path, b.path);
}

/** Open tasks due before today, oldest due date first. */
export function overdueTasks(tasks: readonly Task[], today: IsoDate): Task[] {
    return openTasks(tasks)
        .filter((task) => task.due !== undefined && task.due < today)
        .sort((a, b) => compareDue(a, b) || comparePath(a, b));
}

/** Open tasks due today, highest priority first. */
export function tasksDueToday(tasks: readonly Task[], today: IsoDate): Task[] {
    return openTasks(tasks)
        .filter((task) => task.due === today)
        .sort((a, b) => comparePriority(a, b) || comparePath(a, b));
}

/**
 * Open tasks due from tomorrow through `days` days ahead (inclusive), by due date, then
 * hightest priority first.
 */
export function upcomingTasks(
    tasks: readonly Task[],
    today: IsoDate,
    days: number = DEFAULT_UPCOMING_DAYS,
): Task[] {
    const first = addDays(today, 1);
    const last = addDays(today, days);
    return openTasks(tasks)
        .filter(
            (task) => task.due !== undefined && task.due >= first && task.due <= last,
        )
        .sort((a, b) => compareDue(a, b) || comparePriority(a, b) || comparePath(a, b));
}