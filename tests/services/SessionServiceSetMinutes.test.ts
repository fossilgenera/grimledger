import { describe, expect, it } from "vitest";
import type { TaskRepository } from "../../src/data/repositories/TaskRepository";
import type { WorkSession } from "../../src/domain/models/workSession";
import { SessionService } from "../../src/services/SessionService";
import { makeTask, refOf } from "../queries/builders";
import { InMemoryWorkSessionRepository } from "./fakes/InMemoryWorkSessionRepository";

const task = makeTask("Fix mapping");

const existing: WorkSession = {
  path: "Work Sessions/2026-10-20 Fix mapping.md",
  name: "2026-10-20 Fix mapping",
  task: refOf(task),
  date: "2026-10-20",
  minutes: 60,
  note: "Traced the bad rows",
};

function setup() {
  const taskRepository: TaskRepository = {
    list: () => ({ items: [task], skipped: [] }),
    create: async () => {
      throw new Error("not used");
    },
    update: async () => {
      throw new Error("not used");
    },
  };
  const sessions = new InMemoryWorkSessionRepository();
  sessions.sessions.push(existing);
  const service = new SessionService(
    taskRepository,
    sessions,
    () => "2026-10-27",
  );
  return { service, sessions };
}

describe("SessionService.setMinutes", () => {
  it("changes the minutes and keeps every other field", async () => {
    const { service, sessions } = setup();
    const result = await service.setMinutes(existing.path, 90);
    expect(result.ok).toBe(true);
    expect(sessions.updateCalls).toBe(1);
    expect(sessions.sessions[0]).toEqual({ ...existing, minutes: 90 });
  });

  it("writes nothing when the minutes are already right", async () => {
    const { service, sessions } = setup();
    const result = await service.setMinutes(existing.path, 60);
    expect(result.ok).toBe(true);
    expect(sessions.updateCalls).toBe(0);
  });

  it.each([[0], [-5], [1.5], [Number.NaN]])(
    "rejects %j minutes and writes nothing",
    async (minutes) => {
      const { service, sessions } = setup();
      const result = await service.setMinutes(existing.path, minutes);
      expect(result.ok).toBe(false);
      expect(sessions.updateCalls).toBe(0);
    },
  );

  it("fails for an unknown session", async () => {
    const { service, sessions } = setup();
    const result = await service.setMinutes("Nope.md", 30);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain("not found");
    expect(sessions.updateCalls).toBe(0);
  });

  it("passes a repository failure through", async () => {
    const { service, sessions } = setup();
    sessions.updateFailure = "disk full";
    const result = await service.setMinutes(existing.path, 90);
    expect(!result.ok && result.reason).toBe("disk full");
  });
});
