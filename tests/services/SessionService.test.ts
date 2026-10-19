import { describe, expect, it } from "vitest";
import type { Task } from "../../src/domain/models/task";
import type { TaskRepository } from "../../src/data/repositories/TaskRepository";
import { SessionService } from "../../src/services/SessionService";
import { makeTask } from "../queries/builders";
import { InMemoryWorkSessionRepository } from "./fakes/InMemoryWorkSessionRepository";

const TODAY = "2026-10-19";

function setup(tasks: Task[] = [makeTask("Fix mapping")]) {
  const taskRepository: TaskRepository = {
    list: () => ({ items: [...tasks], skipped: [] }),
    create: async () => {
      throw new Error("not used");
    },
    update: async () => {
      throw new Error("not used");
    },
  };
  const sessions = new InMemoryWorkSessionRepository();
  const service = new SessionService(taskRepository, sessions, () => TODAY);
  return { service, sessions, task: tasks[0] as Task };
}

describe("SessionService.logTime", () => {
  it("creates a session for the task", async () => {
    const { service, sessions, task } = setup();
    const result = await service.logTime({
      taskPath: task.path,
      date: "2026-10-18",
      minutes: 90,
      note: "Traced the bad rows",
    });
    expect(result.ok).toBe(true);
    expect(sessions.createCalls).toBe(1);
    expect(sessions.sessions[0]).toMatchObject({
      task: { path: task.path, name: "Fix mapping" },
      date: "2026-10-18",
      minutes: 90,
      note: "Traced the bad rows",
    });
  });

  it("accepts today's date", async () => {
    const { service, task } = setup();
    const result = await service.logTime({
      taskPath: task.path,
      date: TODAY,
      minutes: 30,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a date after today and writes nothing", async () => {
    const { service, sessions, task } = setup();
    const result = await service.logTime({
      taskPath: task.path,
      date: "2026-10-20",
      minutes: 30,
    });
    expect(result.ok).toBe(false);
    expect(sessions.createCalls).toBe(0);
  });

  it.each([[0], [-5], [1.5], [Number.NaN]])(
    "rejects %j minutes and writes nothing",
    async (minutes) => {
      const { service, sessions, task } = setup();
      const result = await service.logTime({
        taskPath: task.path,
        date: TODAY,
        minutes,
      });
      expect(result.ok).toBe(false);
      expect(sessions.createCalls).toBe(0);
    },
  );

  it("rejects an unknown task path and writes nothing", async () => {
    const { service, sessions } = setup();
    const result = await service.logTime({
      taskPath: "Nope.md",
      date: TODAY,
      minutes: 30,
    });
    expect(result.ok).toBe(false);
    expect(sessions.createCalls).toBe(0);
  });

  it("allows logging time on a complete task", async () => {
    const { service, task } = setup([
      makeTask("Fix mapping", { status: "complete", completed: "2026-10-10" }),
    ]);
    const result = await service.logTime({
      taskPath: task.path,
      date: "2026-10-10",
      minutes: 15,
    });
    expect(result.ok).toBe(true);
  });

  it("allows two sessions on the same day", async () => {
    const { service, sessions, task } = setup();
    await service.logTime({ taskPath: task.path, date: TODAY, minutes: 30 });
    await service.logTime({ taskPath: task.path, date: TODAY, minutes: 45 });
    expect(sessions.sessions.map((s) => s.name)).toEqual([
      "2026-10-19 Fix mapping",
      "2026-10-19 Fix mapping 2",
    ]);
  });
});