import { describe, expect, it } from "vitest";
import type { WorkSession } from "../../src/domain/models/workSession";
import { actualMinutes, sessionsForTask } from "../../src/queries/taskEffort";

const TASK_A = "Work/Clients/ABC Bank/Projects/MRI/Tasks/Fix mapping.md";
const TASK_B = "Work/Clients/XYZ/Projects/API/Tasks/Fix mapping.md";

function makeSession(overrides: Partial<WorkSession> = {}): WorkSession {
  return {
    path: "Work/Clients/ABC Bank/Projects/MRI/Work Sessions/2026-10-04 Fix mapping.md",
    name: "2026-10-04 Fix mapping",
    task: { path: TASK_A, name: "Fix mapping" },
    date: "2026-10-04",
    minutes: 60,
    note: undefined,
    ...overrides,
  };
}

describe("actualMinutes", () => {
  it("is zero when the task has no sessions", () => {
    expect(actualMinutes([], TASK_A)).toBe(0);
  });

  it("adds up the sessions of the task", () => {
    const sessions = [
      makeSession({ path: "a.md", minutes: 45 }),
      makeSession({ path: "b.md", minutes: 120 }),
      makeSession({ path: "c.md", minutes: 90 }),
    ];
    expect(actualMinutes(sessions, TASK_A)).toBe(255);
  });

  it("ignores sessions of other tasks", () => {
    const sessions = [
      makeSession({ path: "a.md", minutes: 30 }),
      makeSession({
        path: "b.md",
        minutes: 500,
        task: { path: TASK_B, name: "Fix mapping" },
      }),
    ];
    expect(actualMinutes(sessions, TASK_A)).toBe(30);
  });
});

describe("sessionsForTask", () => {
  it("returns only the sessions of the task", () => {
    const sessions = [
      makeSession({ path: "a.md" }),
      makeSession({ path: "b.md", task: { path: TASK_B, name: "Fix mapping" } }),
    ];
    expect(sessionsForTask(sessions, TASK_A).map((s) => s.path)).toEqual([
      "a.md",
    ]);
  });

  it("sorts by date, then by path", () => {
    const sessions = [
      makeSession({ path: "z.md", date: "2026-10-05" }),
      makeSession({ path: "b.md", date: "2026-10-04" }),
      makeSession({ path: "a.md", date: "2026-10-04" }),
    ];
    expect(sessionsForTask(sessions, TASK_A).map((s) => s.path)).toEqual([
      "a.md",
      "b.md",
      "z.md",
    ]);
  });

  it("does not modify a frozen input list", () => {
    const sessions = Object.freeze([
      makeSession({ path: "b.md", date: "2026-10-05" }),
      makeSession({ path: "a.md", date: "2026-10-04" }),
    ]);
    expect(() => sessionsForTask(sessions, TASK_A)).not.toThrow();
  });
});