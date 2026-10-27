import { describe, expect, it } from "vitest";
import { blockedTasks } from "../../src/queries/blockedTasks";
import { makeTask } from "./builders";

function names(tasks: readonly { name: string }[]): string[] {
  return tasks.map((task) => task.name);
}

describe("blockedTasks", () => {
  it("returns only tasks with status blocked", () => {
    const tasks = [
      makeTask("Stuck", { status: "blocked" }),
      makeTask("Working", { status: "in-progress" }),
      makeTask("New", { status: "not-started" }),
      makeTask("Done", { status: "complete" }),
      makeTask("Dropped", { status: "cancelled" }),
    ];
    expect(names(blockedTasks(tasks))).toEqual(["Stuck"]);
  });

  it("includes blocked tasks with or without a due date", () => {
    const tasks = [
      makeTask("With date", { status: "blocked", due: "2026-10-01" }),
      makeTask("Without date", { status: "blocked" }),
    ];
    expect(names(blockedTasks(tasks))).toEqual(["With date", "Without date"]);
  });

  it("sorts by path", () => {
    const tasks = [
      makeTask("C", { status: "blocked" }),
      makeTask("A", { status: "blocked" }),
      makeTask("B", { status: "blocked" }),
    ];
    expect(names(blockedTasks(tasks))).toEqual(["A", "B", "C"]);
  });

  it("returns an empty list when nothing is blocked", () => {
    expect(blockedTasks([])).toEqual([]);
  });

  it("does not modify its input", () => {
    const tasks = Object.freeze([
      makeTask("C", { status: "blocked" }),
      makeTask("A", { status: "blocked" }),
      makeTask("B", { status: "blocked" }),
    ]);
    expect(() => blockedTasks(tasks)).not.toThrow();
  });
});

describe("blockedTasks: order", () => {
  it("puts the longest-blocked task first", () => {
    const tasks = [
      makeTask("A", { status: "blocked", blockedSince: "2026-10-03" }),
      makeTask("B", { status: "blocked", blockedSince: "2026-10-01" }),
      makeTask("C", { status: "blocked", blockedSince: "2026-10-02" }),
    ];
    expect(names(blockedTasks(tasks))).toEqual(["B", "C", "A"]);
  });

  it("puts tasks with no blocked since date last, by path", () => {
    const tasks = [
      makeTask("Z", { status: "blocked" }),
      makeTask("Y", { status: "blocked" }),
      makeTask("M", { status: "blocked", blockedSince: "2026-10-04" }),
    ];
    expect(names(blockedTasks(tasks))).toEqual(["M", "Y", "Z"]);
  });

  it("breaks ties by path", () => {
    const tasks = [
      makeTask("B", { status: "blocked", blockedSince: "2026-10-01" }),
      makeTask("A", { status: "blocked", blockedSince: "2026-10-01" }),
    ];
    expect(names(blockedTasks(tasks))).toEqual(["A", "B"]);
  });
});