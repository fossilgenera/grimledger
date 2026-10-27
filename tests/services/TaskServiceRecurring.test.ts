import { beforeEach, describe, expect, it } from "vitest";
import type { Task } from "../../src/domain/models/task";
import type { Result } from "../../src/domain/result";
import { TaskService } from "../../src/services/TaskService";
import { makeProject, makeTask, refOf } from "../queries/builders";
import { InMemoryBlockerRepository } from "./fakes/InMemoryBlockerRepository";
import { InMemoryTaskRepository } from "./fakes/InMemoryTaskRepository";

const TODAY = "2026-10-05";
const WEEKLY = { unit: "week", every: 1 } as const;
const NEXT_NAME = "Weekly update 2026-10-09";
const PROJECT = refOf(makeProject("MRI Reporting"));

function expectOk(result: Result<Task>): Task {
  if (!result.ok) {
    throw new Error(`Expected success but got failure: ${result.reason}`);
  }
  return result.value;
}

function reasonOf(result: Result<Task>): string {
  if (result.ok) {
    throw new Error("Expected a failure but got success");
  }
  return result.reason;
}

function repeating(overrides: Partial<Task> = {}): Task {
  return makeTask("Weekly update", {
    status: "in-progress",
    due: "2026-10-02",
    priority: "high",
    estimatedMinutes: 30,
    recurrence: WEEKLY,
    ...overrides,
  });
}

let tasks: InMemoryTaskRepository;
let service: TaskService;

function named(name: string): Task | undefined {
  return tasks.list().items.find((task) => task.name === name);
}

beforeEach(() => {
  tasks = new InMemoryTaskRepository();
  service = new TaskService(
    tasks,
    () => TODAY,
    new InMemoryBlockerRepository(),
  );
});

describe("createTask with a recurrence", () => {
  it("refuses a repeating task with no due date and writes nothing", async () => {
    const reason = reasonOf(
      await service.createTask({
        project: PROJECT,
        name: "Weekly update",
        priority: "high",
        recurrence: WEEKLY,
      }),
    );
    expect(reason).toContain("due date");
    expect(reason).toContain("first occurrence");
    expect(tasks.createCount).toBe(0);
  });

  it("creates a repeating task that has a due date", async () => {
    const task = expectOk(
      await service.createTask({
        project: PROJECT,
        name: "Weekly update",
        priority: "high",
        due: "2026-10-09",
        recurrence: WEEKLY,
      }),
    );
    expect(task.recurrence).toEqual(WEEKLY);
    expect(tasks.createCount).toBe(1);
  });
});

describe("completeTask with a recurrence", () => {
  it("creates the next occurrence and completes the task", async () => {
    const task = repeating();
    tasks.seed(task);
    expectOk(await service.completeTask(task.path, "Sent"));

    expect(tasks.get(task.path)).toMatchObject({
      status: "complete",
      completed: TODAY,
      outcome: "Sent",
    });
    expect(named(NEXT_NAME)).toMatchObject({
      status: "not-started",
      due: "2026-10-09",
      priority: "high",
      estimatedMinutes: 30,
      recurrence: WEEKLY,
      created: TODAY,
    });
  });

  it("creates the next occurrence before it completes the task", async () => {
    const task = repeating();
    tasks.seed(task);
    let createdWhenUpdated = -1;
    tasks.onUpdate = () => {
      createdWhenUpdated = tasks.createCount;
    };
    await service.completeTask(task.path);
    expect(createdWhenUpdated).toBe(1);
  });

  it("creates nothing for a task that does not repeat", async () => {
    const task = makeTask("One off", {
      status: "in-progress",
      due: "2026-10-02",
    });
    tasks.seed(task);
    expectOk(await service.completeTask(task.path));
    expect(tasks.createCount).toBe(0);
  });

  it("refuses a repeating task with no due date and writes nothing", async () => {
    const task = repeating({ due: undefined });
    tasks.seed(task);
    const reason = reasonOf(await service.completeTask(task.path));
    expect(reason).toContain("no due date");
    expect(reason).toContain("this occurrence");
    expect(tasks.createCount).toBe(0);
    expect(tasks.updateCount).toBe(0);
    expect(tasks.get(task.path)?.status).toBe("in-progress");
  });

  it("does not complete the task when the next occurrence cannot be created", async () => {
    const task = repeating();
    tasks.seed(task);
    tasks.createFailure = "disk full";
    const reason = reasonOf(await service.completeTask(task.path));
    expect(reason).toContain("next occurrence");
    expect(reason).toContain("was not completed");
    expect(tasks.updateCount).toBe(0);
    expect(tasks.get(task.path)?.status).toBe("in-progress");
  });

  it("is safe to retry when completing fails after the next occurrence was created", async () => {
    const task = repeating();
    tasks.seed(task);
    tasks.updateFailure = "disk full";
    const reason = reasonOf(await service.completeTask(task.path));
    expect(reason).toContain("already created");
    expect(tasks.createCount).toBe(1);

    tasks.updateFailure = undefined;
    expectOk(await service.completeTask(task.path));
    expect(tasks.createCount).toBe(1);
    expect(tasks.list().items.filter((t) => t.name === NEXT_NAME)).toHaveLength(
      1,
    );
    expect(tasks.get(task.path)?.status).toBe("complete");
  });

  it("creates no next occurrence when a repeating task is cancelled", async () => {
    const task = repeating();
    tasks.seed(task);
    expectOk(await service.changeTaskStatus(task.path, "cancelled"));
    expect(tasks.createCount).toBe(0);
  });
});
