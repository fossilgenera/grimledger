import { describe, expect, it } from "vitest";
import type { Task } from "../../src/domain/models/task";
import {
  hasNoTasks,
  taskSections,
  type TaskRow,
  type TaskSections,
} from "../../src/queries/taskSections";
import { makeClientRef, makeProject, makeTask, refOf } from "./builders";

const TODAY = "2026-10-12";

const bank = makeClientRef("ABC Bank");
const mri = makeProject("MRI Reporting", { client: bank });

function taskIn(name: string, overrides: Partial<Task> = {}): Task {
  return makeTask(name, { project: refOf(mri), ...overrides });
}

function names(rows: readonly TaskRow[]): string[] {
  return rows.map((row) => row.task.name);
}

describe("taskSections", () => {
  it("puts each task in the section its due date and status call for", () => {
    const tasks = [
      taskIn("Late", { due: "2026-10-09" }),
      taskIn("Today", { due: TODAY }),
      taskIn("Soon", { due: "2026-10-15" }),
      taskIn("Far", { due: "2026-10-30" }),
      taskIn("Undated"),
      taskIn("Stuck", { status: "blocked" }),
    ];
    const sections = taskSections(tasks, [mri], TODAY);

    expect(names(sections.overdue)).toEqual(["Late"]);
    expect(names(sections.dueToday)).toEqual(["Today"]);
    expect(names(sections.upcoming)).toEqual(["Soon"]);
    expect(names(sections.blocked)).toEqual(["Stuck"]);
  });

  it("uses the seven day upcoming window", () => {
    const tasks = [
      taskIn("Day seven", { due: "2026-10-19" }),
      taskIn("Day eight", { due: "2026-10-20" }),
    ];
    const sections = taskSections(tasks, [mri], TODAY);
    expect(names(sections.upcoming)).toEqual(["Day seven"]);
  });

  it("shows an overdue blocked task in both Overdue and Blocked", () => {
    const tasks = [taskIn("Stuck", { status: "blocked", due: "2026-10-01" })];
    const sections = taskSections(tasks, [mri], TODAY);

    expect(names(sections.overdue)).toEqual(["Stuck"]);
    expect(names(sections.blocked)).toEqual(["Stuck"]);
  });

  it("leaves out complete and cancelled tasks everywhere", () => {
    const tasks = [
      taskIn("Done", { status: "complete", due: "2026-10-01" }),
      taskIn("Dropped", { status: "cancelled", due: TODAY }),
    ];
    expect(taskSections(tasks, [mri], TODAY)).toEqual({
      overdue: [],
      dueToday: [],
      blocked: [],
      upcoming: [],
    });
  });

  it("keeps the order each query defines", () => {
    const tasks = [
      taskIn("Newer", { due: "2026-10-10" }),
      taskIn("Older", { due: "2026-10-01" }),
      taskIn("Low", { due: TODAY, priority: "low" }),
      taskIn("Critical", { due: TODAY, priority: "critical" }),
    ];
    const sections = taskSections(tasks, [mri], TODAY);

    expect(names(sections.overdue)).toEqual(["Older", "Newer"]);
    expect(names(sections.dueToday)).toEqual(["Critical", "Low"]);
  });

  it("gives each row its task and a Client / Project context", () => {
    const task = taskIn("Fix mapping", { due: "2026-10-10" });
    const sections = taskSections([task], [mri], TODAY);

    expect(sections.overdue).toEqual([
      { task, context: "ABC Bank / MRI Reporting" },
    ]);
  });

  it("falls back to the project name when the project is not in the list", () => {
    const task = taskIn("Orphan", { due: "2026-10-10" });
    const sections = taskSections([task], [], TODAY);

    expect(sections.overdue.map((row) => row.context)).toEqual(["MRI Reporting"]);
  });

  it("tells apart projects with the same name under different clients", () => {
    const xyz = makeClientRef("XYZ Financial");
    const bankReporting = makeProject("Reporting", { client: bank });
    const xyzReporting = makeProject("Reporting", { client: xyz });
    const tasks = [
      makeTask("One", { project: refOf(bankReporting), due: "2026-10-01" }),
      makeTask("Two", { project: refOf(xyzReporting), due: "2026-10-02" }),
    ];

    const sections = taskSections(tasks, [bankReporting, xyzReporting], TODAY);

    expect(sections.overdue.map((row) => row.context)).toEqual([
      "ABC Bank / Reporting",
      "XYZ Financial / Reporting",
    ]);
  });

  it("returns four empty sections for no tasks", () => {
    expect(taskSections([], [], TODAY)).toEqual({
      overdue: [],
      dueToday: [],
      blocked: [],
      upcoming: [],
    });
  });

  it("does not modify its input", () => {
    const tasks = Object.freeze([
      taskIn("B", { due: "2026-10-02" }),
      taskIn("A", { due: "2026-10-01" }),
    ]);
    const projects = Object.freeze([mri]);
    expect(() => taskSections(tasks, projects, TODAY)).not.toThrow();
  });
});

describe("hasNoTasks", () => {
  function sectionsWith(key: keyof TaskSections, row: TaskRow): TaskSections {
    const sections: TaskSections = {
      overdue: [],
      dueToday: [],
      blocked: [],
      upcoming: [],
    };
    sections[key] = [row];
    return sections;
  }

  it("is true when every section is empty", () => {
    expect(
      hasNoTasks({ overdue: [], dueToday: [], blocked: [], upcoming: [] }),
    ).toBe(true);
  });

  it.each(["overdue", "dueToday", "blocked", "upcoming"] as const)(
    "is false when only the %s section has a row",
    (key) => {
      const row: TaskRow = { task: makeTask("X"), context: "Y" };
      expect(hasNoTasks(sectionsWith(key, row))).toBe(false);
    },
  );
});