import { describe, expect, it } from "vitest";
import type { Task } from "../../src/domain/models/task";
import { openTasks } from "../../src/queries/openTasks";
import { TASK_STATUSES, type TaskStatus } from "../../src/domain/types";

function taskWith(status: TaskStatus): Task {
  return {
    path: `Tasks/${status}.md`,
    name: status,
    project: { path: "Projects/P/P.md", name: "P" },
    status,
    priority: "medium",
    due: undefined,
    estimatedMinutes: undefined,
    created: "2026-10-01",
    completed: undefined,
    outcome: undefined,
    blockedSince: undefined,
    blockedBy: undefined,
    waitingOn: undefined,
    expectedResolution: undefined,
    recurrence: undefined,
  };
}

describe("openTasks", () => {
  it("keeps not-started, in-progress and blocked tasks", () => {
    const result = openTasks(TASK_STATUSES.map(taskWith));
    expect(result.map((t) => t.status)).toEqual([
      "not-started",
      "in-progress",
      "blocked",
    ]);
  });

  it("returns an empty list for an empty input", () => {
    expect(openTasks([])).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const input = TASK_STATUSES.map(taskWith);
    openTasks(input);
    expect(input).toHaveLength(TASK_STATUSES.length);
  });
});
