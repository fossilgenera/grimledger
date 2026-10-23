import { describe, expect, it } from "vitest";
import type { ListResult } from "../../src/data/repositories/ListResult";
import type { TaskRepository } from "../../src/data/repositories/TaskRepository";
import type { Task } from "../../src/domain/models/task";
import { fail, ok, type Result } from "../../src/domain/result";
import { CompletionService } from "../../src/services/CompletionService";
import { SessionService } from "../../src/services/SessionService";
import { TaskService } from "../../src/services/TaskService";
import { makeTask } from "../queries/builders";
import { InMemoryWorkSessionRepository } from "./fakes/InMemoryWorkSessionRepository";
import { InMemoryBlockerRepository } from "./fakes/InMemoryBlockerRepository";

const TODAY = "2026-10-19";

class StubTaskRepository implements TaskRepository {
  updateCalls = 0;
  failUpdate = false;
  onUpdate: () => void = () => {};

  constructor(private tasks: Task[]) {}

  list(): ListResult<Task> {
    return { items: [...this.tasks], skipped: [] };
  }

  async create(): Promise<Result<Task>> {
    throw new Error("not used");
  }

  async update(task: Task): Promise<Result<Task>> {
    this.updateCalls += 1;
    this.onUpdate();
    if (this.failUpdate) {
      return fail("disk full");
    }
    this.tasks = this.tasks.map((t) => (t.path === task.path ? task : t));
    return ok(task);
  }
}

function setup(task: Task = makeTask("Fix mapping", { status: "in-progress" })) {
  const tasks = new StubTaskRepository([task]);
  const sessions = new InMemoryWorkSessionRepository();
  const today = () => TODAY;
  const service = new CompletionService(
    tasks,
    new TaskService(tasks, today, new InMemoryBlockerRepository()),
    new SessionService(tasks, sessions, today),
    today,
  );
  return { service, tasks, sessions, task };
}

describe("CompletionService.complete without time", () => {
  it("completes the task and creates no session", async () => {
    const { service, tasks, sessions, task } = setup();
    const result = await service.complete({
      taskPath: task.path,
      outcome: "Fixed it",
    });
    expect(result.ok).toBe(true);
    expect(sessions.createCalls).toBe(0);
    expect(tasks.list().items[0]).toMatchObject({
      status: "complete",
      completed: TODAY,
      outcome: "Fixed it",
    });
  });
});

describe("CompletionService.complete with time", () => {
  it("creates a session dated today, then completes the task", async () => {
    const { service, tasks, sessions, task } = setup();
    const result = await service.complete({
      taskPath: task.path,
      outcome: "Fixed it",
      minutes: 90,
    });
    expect(result.ok).toBe(true);
    expect(sessions.sessions).toHaveLength(1);
    expect(sessions.sessions[0]).toMatchObject({
      task: { path: task.path },
      date: TODAY,
      minutes: 90,
    });
    expect(tasks.list().items[0]).toMatchObject({
      status: "complete",
      completed: TODAY,
      outcome: "Fixed it",
    });
  });

  it("writes the session before it updates the task", async () => {
    const { service, tasks, sessions, task } = setup();
    let sessionsWhenTaskWasUpdated = -1;
    tasks.onUpdate = () => {
      sessionsWhenTaskWasUpdated = sessions.createCalls;
    };
    await service.complete({ taskPath: task.path, minutes: 30 });
    expect(sessionsWhenTaskWasUpdated).toBe(1);
  });

  it("writes nothing when the task cannot be completed", async () => {
    const { service, tasks, sessions, task } = setup(
      makeTask("Fix mapping", { status: "complete", completed: "2026-10-10" }),
    );
    const result = await service.complete({ taskPath: task.path, minutes: 30 });
    expect(result.ok).toBe(false);
    expect(sessions.createCalls).toBe(0);
    expect(tasks.updateCalls).toBe(0);
  });

  it("writes nothing when the task is not found", async () => {
    const { service, tasks, sessions } = setup();
    const result = await service.complete({ taskPath: "Nope.md", minutes: 30 });
    expect(result.ok).toBe(false);
    expect(sessions.createCalls).toBe(0);
    expect(tasks.updateCalls).toBe(0);
  });

  it("writes nothing when the minutes are invalid", async () => {
    const { service, tasks, sessions, task } = setup();
    const result = await service.complete({ taskPath: task.path, minutes: 0 });
    expect(result.ok).toBe(false);
    expect(sessions.createCalls).toBe(0);
    expect(tasks.updateCalls).toBe(0);
  });

  it("says the time was logged when completing fails afterwards", async () => {
    const { service, tasks, sessions, task } = setup();
    tasks.failUpdate = true;
    const result = await service.complete({ taskPath: task.path, minutes: 30 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("Time was logged");
      expect(result.reason).toContain("disk full");
    }
    expect(sessions.createCalls).toBe(1);
  });
});

describe("CompletionService.complete with a repeating task", () => {
  it("writes nothing when the task repeats but has no due date", async () => {
    const { service, tasks, sessions, task } = setup(
      makeTask("Weekly update", {
        status: "in-progress",
        recurrence: { unit: "week", every: 1 },
      }),
    );
    const result = await service.complete({ taskPath: task.path, minutes: 30 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("no due date");
    }
    expect(sessions.createCalls).toBe(0);
    expect(tasks.updateCalls).toBe(0);
  });
});