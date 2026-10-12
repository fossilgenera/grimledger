import { describe, expect, it } from "vitest";
import {
  overdueTasks,
  tasksDueToday,
  upcomingTasks,
} from "../../src/queries/dueTasks";
import { makeTask } from "./builders";

const TODAY = "2026-10-12";

function names(tasks: readonly { name: string }[]): string[] {
  return tasks.map((task) => task.name);
}

describe("overdueTasks", () => {
  it("returns open tasks due before today", () => {
    const tasks = [
      makeTask("Yesterday", { due: "2026-10-11" }),
      makeTask("Next week", { due: "2026-10-19" }),
    ];
    expect(names(overdueTasks(tasks, TODAY))).toEqual(["Yesterday"]);
  });

  it("does not return a task due today", () => {
    const tasks = [makeTask("Today", { due: TODAY })];
    expect(overdueTasks(tasks, TODAY)).toEqual([]);
  });

  it("ignores tasks with no due date", () => {
    const tasks = [makeTask("No date")];
    expect(overdueTasks(tasks, TODAY)).toEqual([]);
  });

  it("ignores complete and cancelled tasks even when past due", () => {
    const tasks = [
      makeTask("Done", { due: "2026-10-01", status: "complete" }),
      makeTask("Dropped", { due: "2026-10-01", status: "cancelled" }),
    ];
    expect(overdueTasks(tasks, TODAY)).toEqual([]);
  });

  it("includes in-progress and blocked tasks", () => {
    const tasks = [
      makeTask("Working", { due: "2026-10-01", status: "in-progress" }),
      makeTask("Stuck", { due: "2026-10-02", status: "blocked" }),
    ];
    expect(names(overdueTasks(tasks, TODAY))).toEqual(["Working", "Stuck"]);
  });

  it("sorts by due date, oldest first", () => {
    const tasks = [
      makeTask("C", { due: "2026-10-10" }),
      makeTask("A", { due: "2026-09-01" }),
      makeTask("B", { due: "2026-10-02" }),
    ];
    expect(names(overdueTasks(tasks, TODAY))).toEqual(["A", "B", "C"]);
  });

  it("breaks ties on due date by path", () => {
    const tasks = [
      makeTask("B task", { due: "2026-10-01" }),
      makeTask("A task", { due: "2026-10-01" }),
    ];
    expect(names(overdueTasks(tasks, TODAY))).toEqual(["A task", "B task"]);
  });

  it("does not modify its input", () => {
    const tasks = Object.freeze([
      makeTask("C", { due: "2026-10-03" }),
      makeTask("A", { due: "2026-10-01" }),
      makeTask("B", { due: "2026-10-02" }),
    ]);
    expect(() => overdueTasks(tasks, TODAY)).not.toThrow();
  });
});

describe("tasksDueToday", () => {
  it("returns only open tasks due today", () => {
    const tasks = [
      makeTask("Today", { due: TODAY }),
      makeTask("Yesterday", { due: "2026-10-11" }),
      makeTask("Tomorrow", { due: "2026-10-13" }),
      makeTask("No date"),
      makeTask("Done today", { due: TODAY, status: "complete" }),
      makeTask("Dropped today", { due: TODAY, status: "cancelled" }),
    ];
    expect(names(tasksDueToday(tasks, TODAY))).toEqual(["Today"]);
  });

  it("includes blocked tasks", () => {
    const tasks = [makeTask("Stuck", { due: TODAY, status: "blocked" })];
    expect(names(tasksDueToday(tasks, TODAY))).toEqual(["Stuck"]);
  });

  it("sorts by priority, highest first, then by path", () => {
    const tasks = [
      makeTask("Low", { due: TODAY, priority: "low" }),
      makeTask("Medium B", { due: TODAY, priority: "medium" }),
      makeTask("Critical", { due: TODAY, priority: "critical" }),
      makeTask("Medium A", { due: TODAY, priority: "medium" }),
      makeTask("High", { due: TODAY, priority: "high" }),
    ];
    expect(names(tasksDueToday(tasks, TODAY))).toEqual([
      "Critical",
      "High",
      "Medium A",
      "Medium B",
      "Low",
    ]);
  });

  it("does not modify its input", () => {
    const tasks = Object.freeze([
      makeTask("Low", { due: TODAY, priority: "low" }),
      makeTask("Critical", { due: TODAY, priority: "critical" }),
      makeTask("High", { due: TODAY, priority: "high" }),
    ]);
    expect(() => tasksDueToday(tasks, TODAY)).not.toThrow();
  });
});

describe("upcomingTasks", () => {
  it("returns tasks due from tomorrow through seven days ahead", () => {
    const tasks = [
      makeTask("Yesterday", { due: "2026-10-11" }),
      makeTask("Today", { due: "2026-10-12" }),
      makeTask("Tomorrow", { due: "2026-10-13" }),
      makeTask("Day seven", { due: "2026-10-19" }),
      makeTask("Day eight", { due: "2026-10-20" }),
    ];
    expect(names(upcomingTasks(tasks, TODAY))).toEqual([
      "Tomorrow",
      "Day seven",
    ]);
  });

  it("accepts a custom window", () => {
    const tasks = [
      makeTask("Tomorrow", { due: "2026-10-13" }),
      makeTask("Day three", { due: "2026-10-15" }),
      makeTask("Day four", { due: "2026-10-16" }),
    ];
    expect(names(upcomingTasks(tasks, TODAY, 3))).toEqual([
      "Tomorrow",
      "Day three",
    ]);
  });

  it("handles a window that crosses a month boundary", () => {
    const tasks = [
      makeTask("Oct 29", { due: "2026-10-29" }),
      makeTask("Nov 4", { due: "2026-11-04" }),
      makeTask("Nov 5", { due: "2026-11-05" }),
    ];
    expect(names(upcomingTasks(tasks, "2026-10-28"))).toEqual([
      "Oct 29",
      "Nov 4",
    ]);
  });

  it("ignores tasks with no due date and tasks that are complete or cancelled", () => {
    const tasks = [
      makeTask("No date"),
      makeTask("Done", { due: "2026-10-14", status: "complete" }),
      makeTask("Dropped", { due: "2026-10-14", status: "cancelled" }),
    ];
    expect(upcomingTasks(tasks, TODAY)).toEqual([]);
  });

  it("sorts by due date, then priority (highest first), then path", () => {
    const tasks = [
      makeTask("Later", { due: "2026-10-15", priority: "critical" }),
      makeTask("Soon low", { due: "2026-10-13", priority: "low" }),
      makeTask("Soon high B", { due: "2026-10-13", priority: "high" }),
      makeTask("Soon high A", { due: "2026-10-13", priority: "high" }),
    ];
    expect(names(upcomingTasks(tasks, TODAY))).toEqual([
      "Soon high A",
      "Soon high B",
      "Soon low",
      "Later",
    ]);
  });

  it("does not modify its input", () => {
    const tasks = Object.freeze([
      makeTask("C", { due: "2026-10-15" }),
      makeTask("A", { due: "2026-10-13" }),
      makeTask("B", { due: "2026-10-14" }),
    ]);
    expect(() => upcomingTasks(tasks, TODAY)).not.toThrow();
  });
});