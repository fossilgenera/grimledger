import { describe, expect, it } from "vitest";
import type { WorkSession } from "../../../src/domain/models/workSession";
import { mergeDesired, planTimeSync } from "../../../src/domain/rules/timeSync";
import { makeTask, refOf } from "../../queries/builders";

const DATE = "2026-10-27";
const a = refOf(makeTask("A"));
const b = refOf(makeTask("B"));

let counter = 0;
function session(
  task: { path: string; name: string },
  minutes: number,
  date = DATE,
): WorkSession {
  counter += 1;
  return {
    path: `Work Sessions/${date} ${task.name} ${counter}.md`,
    name: `${date} ${task.name} ${counter}`,
    task,
    date,
    minutes,
    note: undefined,
  };
}

describe("mergeDesired", () => {
  it("adds up times for the same task and keeps first-seen order", () => {
    const merged = mergeDesired([
      { task: b, minutes: 10 },
      { task: a, minutes: 30 },
      { task: b, minutes: 5 },
    ]);
    expect(merged.map((item) => [item.task.name, item.minutes])).toEqual([
      ["B", 15],
      ["A", 30],
    ]);
  });

  it("does not modify its input", () => {
    const input = Object.freeze([
      Object.freeze({ task: a, minutes: 10 }),
      Object.freeze({ task: a, minutes: 5 }),
    ]);
    expect(mergeDesired(input)).toEqual([{ task: a, minutes: 15 }]);
  });
});

describe("planTimeSync", () => {
  it("creates a session when the task has none that day", () => {
    expect(planTimeSync([{ task: a, minutes: 60 }], [], DATE)).toEqual([
      { kind: "create", task: a, minutes: 60 },
    ]);
  });

  it("ignores sessions on other days and for other tasks", () => {
    const plan = planTimeSync(
      [{ task: a, minutes: 60 }],
      [session(a, 60, "2026-10-26"), session(b, 60)],
      DATE,
    );
    expect(plan[0]?.kind).toBe("create");
  });

  it("leaves a session alone when the minutes already match", () => {
    expect(
      planTimeSync([{ task: a, minutes: 60 }], [session(a, 60)], DATE),
    ).toEqual([{ kind: "unchanged", task: a, minutes: 60 }]);
  });

  it("treats several sessions that add up to the wanted time as matching", () => {
    const plan = planTimeSync(
      [{ task: a, minutes: 60 }],
      [session(a, 30), session(a, 30)],
      DATE,
    );
    expect(plan[0]?.kind).toBe("unchanged");
  });

  it("updates the single existing session when the minutes differ", () => {
    const existing = session(a, 30);
    expect(planTimeSync([{ task: a, minutes: 90 }], [existing], DATE)).toEqual([
      { kind: "update", session: existing, minutes: 90 },
    ]);
  });

  it("reports a conflict when several sessions differ from the wanted time", () => {
    const plan = planTimeSync(
      [{ task: a, minutes: 120 }],
      [session(a, 30), session(a, 30)],
      DATE,
    );
    expect(plan).toEqual([
      { kind: "conflict", task: a, wanted: 120, existing: 60, sessionCount: 2 },
    ]);
  });

  it("plans each task separately, in the order given", () => {
    const plan = planTimeSync(
      [
        { task: b, minutes: 10 },
        { task: a, minutes: 20 },
      ],
      [session(a, 20)],
      DATE,
    );
    expect(plan.map((action) => action.kind)).toEqual(["create", "unchanged"]);
  });

  it("does not modify its input", () => {
    const sessions = Object.freeze([Object.freeze(session(a, 30))]);
    expect(() =>
      planTimeSync(Object.freeze([{ task: a, minutes: 60 }]), sessions, DATE),
    ).not.toThrow();
  });
});
