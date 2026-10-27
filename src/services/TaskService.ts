import type { BlockerRepository } from "../data/repositories/BlockerRepository";
import {
  NewTaskInput,
  TaskRepository,
} from "../data/repositories/TaskRepository";
import { Task } from "../domain/models/task";
import { fail, ok, Result } from "../domain/result";
import {
  blockTask as applyBlock,
  closedBlocker,
  type BlockDetails,
} from "../domain/rules/blocking";
import { nextOccurrence } from "../domain/rules/nextOccurrence";
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
    private readonly blockers: BlockerRepository,
  ) {}

  async createTask(input: CreateTaskInput): Promise<Result<Task>> {
    if (input.recurrence !== undefined && input.due === undefined) {
      return fail(
        "A repeating task needs a due date for its first occurrence.",
      );
    }
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
    return this.save(found.value, changed.value);
  }

  async blockTask(
    taskPath: string,
    details: BlockDetails,
  ): Promise<Result<Task>> {
    const found = this.find(taskPath);
    if (!found.ok) {
      return found;
    }

    const blocked = applyBlock(found.value, details, this.today());
    if (!blocked.ok) {
      return blocked;
    }
    return this.tasks.update(blocked.value);
  }

  async unblockTask(taskPath: string): Promise<Result<Task>> {
    const found = this.find(taskPath);
    if (!found.ok) {
      return found;
    }
    if (found.value.status !== "blocked") {
      return fail(`"${found.value.name}" is not blocked.`);
    }
    return this.changeTaskStatus(taskPath, "in-progress");
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
      outcome: normalizeOutcome(outcome) ?? changed.value.outcome,
    };

    // Plan the next occurrence before writing anything, so a repeating
    // task with no due date is refused with nothing written.
    const next = nextOccurrence(found.value, this.today());
    if (!next.ok) {
      return next;
    }

    // Create the next occurrence first. If a previous attempt already
    // made it, skip the create, so a retry never makes it twice.
    const plan = next.value;
    if (plan !== undefined) {
      const exists = this.tasks
        .list()
        .items.some(
          (task) =>
            task.project.path === plan.project.path && task.name === plan.name,
        );
      if (!exists) {
        const created = await this.tasks.create({
          project: plan.project,
          name: plan.name,
          priority: plan.priority,
          due: plan.due,
          estimatedMinutes: plan.estimatedMinutes,
          recurrence: plan.recurrence,
          created: this.today(),
        });
        if (!created.ok) {
          return fail(
            `Could not create the next occurrence, so "${found.value.name}" was not completed (${created.reason}).`,
          );
        }
      }
    }

    const saved = await this.save(found.value, completed);
    if (!saved.ok && plan !== undefined) {
      return fail(
        `Could not finish completing "${found.value.name}" (${saved.reason}). The next occurrence was already created, so completing again is safe.`,
      );
    }
    return saved;
  }

  /**
   * Writes the changed task. When the task was blocked, its closed blocker
   * record is written first, so a failure leaves the task blocked rather
   * than unblocked with no history. A retry after a failed update writes the
   * record a second time; the message says so.
   */
  private async save(before: Task, after: Task): Promise<Result<Task>> {
    const record = closedBlocker(before, this.today());
    if (record === undefined) {
      return this.tasks.update(after);
    }

    const created = await this.blockers.create({ task: before, ...record });
    if (!created.ok) {
      return fail(
        `Could not record the blocker, so the task was not changed (${created.reason}).`,
      );
    }

    const afterRecord = (reason: string): Result<Task> =>
      fail(
        `The blocker was recorded, but the task was not updated (${reason}). Trying again records it a second time, so delete the duplicate in the project's Blockers folder.`,
      );
    try {
      const updated = await this.tasks.update(after);
      return updated.ok ? updated : afterRecord(updated.reason);
    } catch (error) {
      return afterRecord(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private find(taskPath: string): Result<Task> {
    const task = this.tasks.list().items.find((t) => t.path === taskPath);
    if (task === undefined) {
      return fail(`Task "${taskPath}" was not found.`);
    }
    return ok(task);
  }
}
