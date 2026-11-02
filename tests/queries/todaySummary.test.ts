import { describe, expect, it } from "vitest";
import type { DailyNote } from "../../src/domain/models/dailyNote";
import type { Task } from "../../src/domain/models/task";
import type { WorkSession } from "../../src/domain/models/workSession";
import { todaySummary } from "../../src/queries/todaySummary";
import { makeTask, refOf } from "./builders";

const TODAY = "2026-10-27";

let counter = 0;
function makeSession(task: Task, date: string, minutes: number): WorkSession {
  counter += 1;
  return {
    path: `Work Sessions/${date} ${task.name} ${counter}.md`,
    name: `${date} ${task.name} ${counter}`,
    task: refOf(task),
    date,
    minutes,
    note: undefined,
  };
}

const NOTE_TODAY: DailyNote = {
  path: "Work/Daily/2026/2026-10-27.md",
  name: "2026-10-27",
  date: TODAY,
};

describe("todaySummary: time", () => {
  it("adds up today's sessions per task and in total", () => {
    const a = makeTask("A");
    const b = makeTask("B");
    const summary = todaySummary(
      [],
      [
        makeSession(a, TODAY, 30),
        makeSession(a, TODAY, 45),
        makeSession(b, TODAY, 15),
      ],
      [a, b],
      TODAY,
    );
    expect(summary.totalMinutes).toBe(90);
    expect(summary.time.map((row) => [row.task.name, row.minutes])).toEqual([
      ["A", 75],
      ["B", 15],
    ]);
  });

  it("ignores sessions on other days", () => {
    const a = makeTask("A");
    const summary = todaySummary(
      [],
      [makeSession(a, "2026-10-26", 60), makeSession(a, "2026-10-28", 60)],
      [a],
      TODAY,
    );
    expect(summary.totalMinutes).toBe(0);
    expect(summary.time).toEqual([]);
  });

  it("keeps same-named tasks in different projects apart", () => {
    const first = makeTask("Report", {
      project: { path: "Work/Clients/X/Projects/P1/P1.md", name: "P1" },
    });
    const second = makeTask("Report", {
      project: { path: "Work/Clients/X/Projects/P2/P2.md", name: "P2" },
    });
    const summary = todaySummary(
      [],
      [makeSession(first, TODAY, 10), makeSession(second, TODAY, 20)],
      [first, second],
      TODAY,
    );
    expect(summary.time).toHaveLength(2);
  });

  it("puts the most time first, then orders by path", () => {
    const a = makeTask("A");
    const b = makeTask("B");
    const c = makeTask("C");
    const summary = todaySummary(
      [],
      [
        makeSession(c, TODAY, 30),
        makeSession(b, TODAY, 30),
        makeSession(a, TODAY, 10),
      ],
      [a, b, c],
      TODAY,
    );
    expect(summary.time.map((row) => row.task.name)).toEqual(["B", "C", "A"]);
  });
});

describe("todaySummary: completed and daily note", () => {
  it("lists tasks completed today only", () => {
    const today = makeTask("Done today", {
      status: "complete",
      completed: TODAY,
    });
    const earlier = makeTask("Done earlier", {
      status: "complete",
      completed: "2026-10-20",
    });
    const open = makeTask("Open", { status: "in-progress" });
    const summary = todaySummary([], [], [open, earlier, today], TODAY);
    expect(summary.completed.map((task) => task.name)).toEqual(["Done today"]);
  });

  it("reports whether today's daily note exists", () => {
    expect(todaySummary([NOTE_TODAY], [], [], TODAY).hasDailyNote).toBe(true);
    expect(todaySummary([], [], [], TODAY).hasDailyNote).toBe(false);
    expect(
      todaySummary([{ ...NOTE_TODAY, date: "2026-10-26" }], [], [], TODAY)
        .hasDailyNote,
    ).toBe(false);
  });

  it("is empty when there is nothing", () => {
    expect(todaySummary([], [], [], TODAY)).toEqual({
      hasDailyNote: false,
      totalMinutes: 0,
      time: [],
      completed: [],
    });
  });

  it("does not modify its input", () => {
    const a = makeTask("A", { status: "complete", completed: TODAY });
    expect(() =>
      todaySummary(
        Object.freeze([NOTE_TODAY]),
        Object.freeze([makeSession(a, TODAY, 5)]),
        Object.freeze([a]),
        TODAY,
      ),
    ).not.toThrow();
  });
});
