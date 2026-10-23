import { ListResult } from "../../../src/data/repositories/ListResult";
import {
  NewTaskInput,
  TaskRepository,
} from "../../../src/data/repositories/TaskRepository";
import {
  taskNotePath,
  validateEntityName,
} from "../../../src/data/VaultLayout";
import { Task } from "../../../src/domain/models/task";
import { fail, ok, Result } from "../../../src/domain/result";

export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, Task>();

  // How many times update() wrote a task.
  updateCount = 0;

  // Puts a task in the store directly, bypassing create()
  seed(task: Task): void {
    this.tasks.set(task.path, task);
  }

  get(path: string): Task | undefined {
    return this.tasks.get(path);
  }

  list(): ListResult<Task> {
    return { items: [...this.tasks.values()], skipped: [] };
  }

  async create(input: NewTaskInput): Promise<Result<Task>> {
    const nameError = validateEntityName(input.name);
    if (nameError !== undefined) {
      return fail(nameError);
    }

    const path = taskNotePath(input.project.path, input.name);
    if (this.tasks.has(path)) {
      return fail(
        `A task named "${input.name}" already exists in project "${input.project.name}"`,
      );
    }

    const task: Task = {
      path,
      name: input.name.trim(),
      project: input.project,
      status: "not-started",
      priority: input.priority,
      due: input.due,
      estimatedMinutes: input.estimatedMinutes,
      created: input.created,
      completed: undefined,
      outcome: undefined,
      blockedSince: undefined,
      blockedBy: undefined,
      waitingOn: undefined,
      expectedResolution: undefined,
      recurrence: input.recurrence,
    };
    this.tasks.set(path, task);
    return ok(task);
  }

  async update(task: Task): Promise<Result<Task>> {
    if (!this.tasks.has(task.path)) {
      return fail(`Task note "${task.path}" does not exist.`);
    }
    this.tasks.set(task.path, task);
    this.updateCount += 1;
    return ok(task);
  }
}
