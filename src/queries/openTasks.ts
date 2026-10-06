import type { Task } from "../domain/models/task";

/** A task is open until it is complete or cancelled. Blocked tasks are open. */
export function openTasks(tasks: readonly Task[]): Task[] {
    return tasks.filter(
        (task) => task.status !== "complete" && task.status !== "cancelled",
    );
}