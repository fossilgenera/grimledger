import { Task } from "../models/task";
import { fail, ok, Result } from "../result";
import { IsoDate, TaskStatus } from "../types";

export const TASK_TRANSITIONS: Readonly<
Record<TaskStatus, readonly TaskStatus[]>
> = {
    "not-started": ["in-progress", "blocked", "complete", "cancelled"],
    "in-progress": ["not-started", "blocked", "complete", "cancelled"],
    blocked: ["in-progress", "complete", "cancelled"],
    complete: ["in-progress"],
    cancelled: ["not-started"],
};

export function canChangeStatus(from: TaskStatus, to: TaskStatus): boolean {
    return TASK_TRANSITIONS[from].includes(to);
}

// Returns a new task, never mutates the input
export function applyStatusChange(
    task: Task,
    target: TaskStatus,
    today: IsoDate,
): Result<Task> {
    if (!canChangeStatus(task.status, target)) {
        return fail(`Cannot change a task from "${task.status}" to "${target}"`);
    }

    let completed = task.completed;
    if (target === "complete") {
        completed = today;
    } else if (task.status === "complete") {
        completed = undefined;
    }

    return ok({...task, status: target, completed });
}