import { describe, expect, it } from "vitest";
import type { Task } from "../../../src/domain/models/task";
import { nextOccurrence } from "../../../src/domain/rules/nextOccurrence";
import { makeTask } from "../../queries/builders";

const TODAY = "2026-10-05";
const WEEKLY = { unit: "week", every: 1 } as const;

function planFor(task: Task) {
  const result = nextOccurrence(task, TODAY);
  if (!result.ok) {
    throw new Error(`Expected success but got failure: ${result.reason}`);
  }
  return result.value;
}

describe("nextOccurrence", () => {
  it("returns nothing for a task that does not repeat", () => {
    expect(planFor(makeTask("One off", { due: "2026-10-02" }))).toBeUndefined();
  });

  it("copies the task and moves the due date and name on", () => {
    const task = makeTask("Weekly update", {
      status: "in-progress",
      due: "2026-10-02",
      priority: "high",
      estimatedMinutes: 30,
      recurrence: WEEKLY,
    });
    expect(planFor(task)).toEqual({
      project: task.project,
      name: "Weekly update 2026-10-09",
      priority: "high",
      due: "2026-10-09",
      estimatedMinutes: 30,
      recurrence: WEEKLY,
    });
  });

  it("replaces a trailing date in the name", () => {
    const task = makeTask("Weekly update 2026-10-02", {
      due: "2026-10-02",
      recurrence: WEEKLY,
    });
    expect(planFor(task)?.name).toBe("Weekly update 2026-10-09");
  });

  it("stays on the schedule when completed early", () => {
    const task = makeTask("Weekly update", {
      due: "2026-10-16",
      recurrence: WEEKLY,
    });
    expect(planFor(task)?.due).toBe("2026-10-23");
  });

  it("catches up when the task is long overdue", () => {
    const task = makeTask("Weekly update", {
      due: "2026-09-04",
      recurrence: WEEKLY,
    });
    expect(planFor(task)?.due).toBe("2026-10-09");
  });

  it("clamps a monthly task to the end of a shorter month", () => {
    const task = makeTask("Monthly review", {
      due: "2026-10-31",
      recurrence: { unit: "month", every: 1 },
    });
    expect(planFor(task)?.due).toBe("2026-11-30");
  });

  it("fails when the task repeats but has no due date", () => {
    const task = makeTask("Weekly update", { recurrence: WEEKLY });
    const result = nextOccurrence(task, TODAY);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("no due date");
    }
  });
});