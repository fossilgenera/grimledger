import { NewTaskInput, TaskRepository } from "../data/repositories/TaskRepository";
import { Task } from "../domain/models/task";
import { fail, Result } from "../domain/result";
import { applyStatusChange } from "../domain/rules/taskStatus";
import { IsoDate, TaskStatus } from "../domain/types";

export type CreateTaskInput = Omit<NewTaskInput, "created">;

/** Trimmed text, or undefined when empty. */
function normalizeOutcome(outcome: string | undefined): string | undefined {
    const trimmed = outcome?.trim();
    return trimmed === undefined || trimmed === "" ? undefined : trimmed;
}

export class TaskService {
    constructor(
        private readonly tasks: TaskRepository,
        private readonly today: () => IsoDate,
    ) {}

    createTask(input: CreateTaskInput): Promise<Result<Task>> {
        return this.tasks.create({ ...input, created: this.today() });
    }

    async changeTaskStatus(
        taskPath: string,
        target: TaskStatus,
    ): Promise<Result<Task>> {
        const found = this.find(taskPath);
        if (!found.ok) {
            return found;
        }

        const changed = applyStatusChange(found.value, target, this.today());
        if (!changed.ok) {
            return changed;
        }
        return this.tasks.update(changed.value);
    }
    async completeTask(
        taskPath: string,
        outcome?: string,
    ): Promise<Result<Task>> {
        const found = this.find(taskPath);
        if (!found.ok) {
            return found;
        }

        const changed = applyStatusChange(found.value, "complete", this.today());
        if (!changed.ok) {
            return changed;
        }

        const completed: Task = {
            ...changed.value,
            outcome:normalizeOutcome(outcome) ?? changed.value.outcome,
        };
        return this.tasks.update(completed);
    }

    private find(taskPath: string): Result<Task> {
        const task = this.tasks.list().items.find((t) => t.path === taskPath);
        if (task === undefined) {
            return fail(`Task "${taskPath}" was not found.`);
        }
        return { ok: true, value: task };
    }
}