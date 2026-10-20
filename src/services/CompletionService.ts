import type { TaskRepository } from "../data/repositories/TaskRepository";
import type { Task } from "../domain/models/task";
import { fail, type Result } from "../domain/result";
import { applyStatusChange } from "../domain/rules/taskStatus";
import type { IsoDate } from "../domain/types";
import type { SessionService } from "./SessionService";
import type { TaskService } from "./TaskService";

export interface CompleteInput {
  taskPath: string;
  outcome?: string;
  /** Whole minutes spent. When present, a session dated today is logged first. */
  minutes?: number;
}

/**
 * Completes a task, optionally logging time spent.
 *
 * Two notes are written, and that cannot be atomic. So every check that can
 * be made runs first, and the session is written before the task changes.
 * A failure in between leaves a correct session and an unchanged task,
 * never a completed task that has lost its time.
 */
export class CompletionService {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly taskService: TaskService,
    private readonly sessionService: SessionService,
    private readonly today: () => IsoDate,
  ) {}

  async complete(input: CompleteInput): Promise<Result<Task>> {
    if (input.minutes === undefined) {
      return this.taskService.completeTask(input.taskPath, input.outcome);
    }

    const task = this.tasks
      .list()
      .items.find((candidate) => candidate.path === input.taskPath);
    if (task === undefined) {
      return fail(`Task "${input.taskPath}" was not found.`);
    }

    // Would the completion be allowed? Ask the rule before writing anything.
    const check = applyStatusChange(task, "complete", this.today());
    if (!check.ok) {
      return check;
    }

    const logged = await this.sessionService.logTime({
      taskPath: task.path,
      date: this.today(),
      minutes: input.minutes,
    });
    if (!logged.ok) {
      return fail(logged.reason);
    }

    try {
      const completed = await this.taskService.completeTask(
        task.path,
        input.outcome,
      );
      if (!completed.ok) {
        return fail(unfinished(completed.reason));
      }
      return completed;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return fail(unfinished(message));
    }
  }
}

function unfinished(reason: string): string {
  return (
    `Time was logged, but the task was not completed (${reason}). ` +
    `Use Complete task again and leave Time spent empty.`
  );
}