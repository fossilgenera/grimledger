import { describe, expect, it } from "vitest";
import {
  EMPTY_INDEX,
  type IndexSnapshot,
} from "../../../src/data/index/buildIndex";
import {
  collectSkipped,
  describeSkippedCount,
} from "../../../src/ui/views/skippedNotes";

function indexWithSkipped(
  clients: string[],
  projects: string[],
  tasks: string[],
  workSessions: string[] = [],
  blockers: string[] = [],
): IndexSnapshot {
  const skip = (paths: string[]) =>
    paths.map((path) => ({ path, reason: `bad ${path}` }));
  return {
    clients: { items: [], skipped: skip(clients) },
    projects: { items: [], skipped: skip(projects) },
    tasks: { items: [], skipped: skip(tasks) },
    workSessions: { items: [], skipped: skip(workSessions) },
    blockers: { items: [], skipped: skip(blockers) },
  };
}

describe("collectSkipped", () => {
  it("returns an empty list when nothing was skipped", () => {
    expect(collectSkipped(EMPTY_INDEX)).toEqual([]);
  });

  it("tags each entry with the kind of note it came from", () => {
    const result = collectSkipped(
      indexWithSkipped(["c.md"], ["p.md"], ["t.md"], ["w.md"]),
    );
    expect(result).toEqual([
      { path: "c.md", reason: "bad c.md", kind: "client" },
      { path: "p.md", reason: "bad p.md", kind: "project" },
      { path: "t.md", reason: "bad t.md", kind: "task" },
      { path: "w.md", reason: "bad w.md", kind: "work session" },
    ]);
  });

  it("includes skipped work sessions", () => {
    const result = collectSkipped(indexWithSkipped([], [], [], ["s.md"]));
    expect(result).toEqual([
      { path: "s.md", reason: "bad s.md", kind: "work session" },
    ]);
  });

  it("sorts by path across all kinds", () => {
    const result = collectSkipped(
      indexWithSkipped(["z.md"], ["m.md"], ["a.md"], ["q.md"]),
    );
    expect(result.map((entry) => entry.path)).toEqual([
      "a.md",
      "m.md",
      "q.md",
      "z.md",
    ]);
    expect(result.map((entry) => entry.kind)).toEqual([
      "task",
      "project",
      "work session",
      "client",
    ]);
  });

  it("does not modify its input", () => {
    const index = indexWithSkipped(
      ["b.md", "a.md"],
      ["d.md"],
      ["c.md"],
      ["e.md"],
    );
    Object.freeze(index.clients.skipped);
    Object.freeze(index.projects.skipped);
    Object.freeze(index.tasks.skipped);
    Object.freeze(index.workSessions.skipped);
    expect(() => collectSkipped(index)).not.toThrow();
  });
});

describe("describeSkippedCount", () => {
  it("uses the singular for one", () => {
    expect(describeSkippedCount(1)).toBe("1 note skipped");
  });

  it.each([
    [0, "0 notes skipped"],
    [2, "2 notes skipped"],
    [12, "12 notes skipped"],
  ])("uses the plural for %i", (count, expected) => {
    expect(describeSkippedCount(count)).toBe(expected);
  });

  it.each([-1, 1.5, Number.NaN])("throws for the invalid count %s", (bad) => {
    expect(() => describeSkippedCount(bad)).toThrow();
  });
});

describe("collectSkipped: blockers", () => {
  it("includes skipped blockers", () => {
    const result = collectSkipped(indexWithSkipped([], [], [], [], ["b.md"]));
    expect(result).toEqual([{ path: "b.md", reason: "bad b.md", kind: "blocker" }]);
  });
});