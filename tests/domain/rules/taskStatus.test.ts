import { describe, expect, it } from "vitest";
import type { Task } from "../../../src/domain/models/task";
import type { Result } from "../../../src/domain/result";
import {
  allowedStatusChanges,
  applyStatusChange,
  canChangeStatus,
} from "../../../src/domain/rules/taskStatus";
import { TASK_STATUSES, type TaskStatus } from "../../../src/domain/types";

// Written out by hand, independent of TASK_TRANSITIONS, so the test
// checks the table instead of copying it.
const EXPECTED_ALLOWED: ReadonlyArray<readonly [TaskStatus, TaskStatus]> = [
  ["not-started", "in-progress"],
  ["not-started", "blocked"],
  ["not-started", "complete"],
  ["not-started", "cancelled"],
  ["in-progress", "not-started"],
  ["in-progress", "blocked"],
  ["in-progress", "complete"],
  ["in-progress", "cancelled"],
  ["blocked", "in-progress"],
  ["blocked", "complete"],
  ["blocked", "cancelled"],
  ["complete", "in-progress"],
  ["cancelled", "not-started"],
];

const TODAY = "2026-10-05";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    path: "Work/Clients/ABC Bank/Projects/MRI Reporting/Tasks/Fix mapping.md",
    name: "Fix mapping",
    project: {
      path: "Work/Clients/ABC Bank/Projects/MRI Reporting/MRI Reporting.md",
      name: "MRI Reporting",
    },
    status: "not-started",
    priority: "medium",
    due: undefined,
    estimatedMinutes: undefined,
    created: "2026-10-01",
    completed: undefined,
    outcome: undefined,
    ...overrides,
  };
}

function expectOk(result: Result<Task>): Task {
  if (!result.ok) {
    throw new Error(`Expected success but got failure: ${result.reason}`);
  }
  return result.value;
}

describe("canChangeStatus", () => {
  for (const from of TASK_STATUSES) {
    for (const to of TASK_STATUSES) {
      const expected = EXPECTED_ALLOWED.some(([f, t]) => f === from && t === to);
      it(`${from} -> ${to} is ${expected ? "allowed" : "rejected"}`, () => {
        expect(canChangeStatus(from, to)).toBe(expected);
      });
    }
  }
});

describe("applyStatusChange", () => {
  it("returns the task with the new status on an allowed change", () => {
    const task = makeTask({ status: "not-started" });
    const updated = expectOk(applyStatusChange(task, "in-progress", TODAY));
    expect(updated.status).toBe("in-progress");
  });

  it("fails with a reason naming both statuses on a disallowed change", () => {
    const task = makeTask({ status: "cancelled" });
    const result = applyStatusChange(task, "complete", TODAY);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("cancelled");
      expect(result.reason).toContain("complete");
    }
  });

  it("fails when the status does not change", () => {
    const task = makeTask({ status: "in-progress" });
    expect(applyStatusChange(task, "in-progress", TODAY).ok).toBe(false);
  });

  it("sets completed to today when moving to complete", () => {
    const task = makeTask({ status: "in-progress" });
    const updated = expectOk(applyStatusChange(task, "complete", TODAY));
    expect(updated.completed).toBe(TODAY);
  });

  it("clears completed when reopening a complete task", () => {
    const task = makeTask({ status: "complete", completed: "2026-10-03" });
    const updated = expectOk(applyStatusChange(task, "in-progress", TODAY));
    expect(updated.status).toBe("in-progress");
    expect(updated.completed).toBeUndefined();
  });

  it("does not set completed when cancelling", () => {
    const task = makeTask({ status: "in-progress" });
    const updated = expectOk(applyStatusChange(task, "cancelled", TODAY));
    expect(updated.completed).toBeUndefined();
  });

  it("leaves completed alone on unrelated changes", () => {
    const task = makeTask({ status: "not-started", completed: undefined });
    const updated = expectOk(applyStatusChange(task, "blocked", TODAY));
    expect(updated.completed).toBeUndefined();
  });

  it("does not mutate the input task", () => {
    const task = Object.freeze(makeTask({ status: "in-progress" }));
    const updated = expectOk(applyStatusChange(task, "complete", TODAY));
    expect(task.status).toBe("in-progress");
    expect(task.completed).toBeUndefined();
    expect(updated).not.toBe(task);
  });

  it("preserves every other field", () => {
    const task = makeTask({
      status: "in-progress",
      priority: "high",
      due: "2026-10-06",
      estimatedMinutes: 120,
    });
    const updated = expectOk(applyStatusChange(task, "complete", TODAY));
    expect(updated).toEqual({ ...task, status: "complete", completed: TODAY });
  });
});

describe("allowedStatusChanges", () => {
  for (const from of TASK_STATUSES) {
    it(`lists exactly the allowed targets from ${from}`, () => {
      const expected = EXPECTED_ALLOWED.filter(([f]) => f === from).map(
        ([, t]) => t,
      );
      expect([...allowedStatusChanges(from)].sort()).toEqual(
        [...expected].sort(),
      );
    });
  }

  it("agrees with canChangeStatus for every pair", () => {
    for (const from of TASK_STATUSES) {
      for (const to of TASK_STATUSES) {
        expect(allowedStatusChanges(from).includes(to)).toBe(
          canChangeStatus(from, to),
        );
      }
    }
  });
});