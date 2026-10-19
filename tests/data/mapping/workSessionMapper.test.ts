import { describe, expect, it } from "vitest";
import {
  workSessionFromFrontmatter,
  workSessionToFrontmatter,
} from "../../../src/data/mapping/workSessionMapper";

const PATH =
  "Work/Clients/ABC Bank/Projects/MRI Reporting/Work Sessions/2026-10-04 Fix mapping.md";

function validFrontmatter(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    type: "work_session",
    task: "[[Fix mapping]]",
    date: "2026-10-04",
    minutes: 90,
    note: "Traced the bad rows",
    ...overrides,
  };
}

function reasonOf(frontmatter: Record<string, unknown> | undefined): string {
  const result = workSessionFromFrontmatter(PATH, frontmatter);
  if (result.ok) {
    throw new Error("Expected a failure but the mapping succeeded");
  }
  return result.reason;
}

describe("workSessionFromFrontmatter: valid input", () => {
  it("maps a fully populated session", () => {
    expect(workSessionFromFrontmatter(PATH, validFrontmatter())).toEqual({
      ok: true,
      value: {
        path: PATH,
        name: "2026-10-04 Fix mapping",
        taskLinkPath: "Fix mapping",
        date: "2026-10-04",
        minutes: 90,
        note: "Traced the bad rows",
      },
    });
  });

  it("treats a null, missing or blank note as undefined", () => {
    for (const note of [null, undefined, "   "]) {
      const result = workSessionFromFrontmatter(
        PATH,
        validFrontmatter({ note }),
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.note).toBeUndefined();
      }
    }
  });

  it("accepts a task link with an alias", () => {
    const result = workSessionFromFrontmatter(
      PATH,
      validFrontmatter({ task: "[[Fix mapping|the fix]]" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.taskLinkPath).toBe("Fix mapping");
    }
  });
});

describe("workSessionFromFrontmatter: rejected input", () => {
  it("rejects undefined frontmatter", () => {
    expect(reasonOf(undefined)).toContain("Not a work session note");
  });

  it("rejects another note type", () => {
    expect(reasonOf(validFrontmatter({ type: "task" }))).toContain(
      "Not a work session note",
    );
  });

  it("rejects a missing task link", () => {
    expect(reasonOf(validFrontmatter({ task: undefined }))).toContain(
      "task link",
    );
  });

  it("rejects a task value that is not a wikilink", () => {
    expect(reasonOf(validFrontmatter({ task: "Fix mapping" }))).toContain(
      "task link",
    );
  });

  it("rejects a missing date", () => {
    expect(reasonOf(validFrontmatter({ date: null }))).toContain("date");
  });

  it("rejects an impossible date", () => {
    expect(reasonOf(validFrontmatter({ date: "2026-02-30" }))).toContain(
      "date",
    );
  });

  it.each([[0], [-5], [1.5], ["90"], [null], [undefined]])(
    "rejects minutes %j",
    (value) => {
      expect(reasonOf(validFrontmatter({ minutes: value }))).toContain(
        "minutes",
      );
    },
  );

  it("rejects a note that is not text", () => {
    expect(reasonOf(validFrontmatter({ note: 5 }))).toContain("note");
  });
});

describe("workSessionToFrontmatter", () => {
  const input = {
    taskLink: "[[Fix mapping]]",
    date: "2026-10-04",
    minutes: 90,
    note: undefined,
  };

  it("writes every owned key, using null for an absent note", () => {
    expect(workSessionToFrontmatter(input)).toEqual({
      type: "work_session",
      task: "[[Fix mapping]]",
      date: "2026-10-04",
      minutes: 90,
      note: null,
    });
  });

  it("round trips through workSessionFromFrontmatter", () => {
    const written = workSessionToFrontmatter({ ...input, note: "Done" });
    expect(workSessionFromFrontmatter(PATH, written)).toEqual({
      ok: true,
      value: {
        path: PATH,
        name: "2026-10-04 Fix mapping",
        taskLinkPath: "Fix mapping",
        date: "2026-10-04",
        minutes: 90,
        note: "Done",
      },
    });
  });
});