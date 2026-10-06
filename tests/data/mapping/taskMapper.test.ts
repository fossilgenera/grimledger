import { describe, expect, it } from "vitest";
import {
  taskFromFrontmatter,
  taskMutableToFrontmatter,
  taskToFrontmatter,
} from "../../../src/data/mapping/taskMapper";

const PATH = "Work/Clients/ABC Bank/Projects/MRI Reporting/Tasks/Fix mapping.md";

function validFrontmatter(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    type: "task",
    project: "[[MRI Reporting]]",
    status: "in-progress",
    priority: "high",
    due: "2026-10-06",
    estimated_minutes: 120,
    created: "2026-10-04",
    completed: null,
    outcome: null,
    ...overrides,
  };
}

function reasonOf(frontmatter: Record<string, unknown> | undefined): string {
  const result = taskFromFrontmatter(PATH, frontmatter);
  if (result.ok) {
    throw new Error("Expected a failure but the mapping succeeded");
  }
  return result.reason;
}

describe("taskFromFrontmatter: valid input", () => {
  it("maps a fully populated task", () => {
    const result = taskFromFrontmatter(
      PATH,
      validFrontmatter({ completed: "2026-10-05", outcome: "Fixed it" }),
    );
    expect(result).toEqual({
      ok: true,
      value: {
        path: PATH,
        name: "Fix mapping",
        projectLinkPath: "MRI Reporting",
        status: "in-progress",
        priority: "high",
        due: "2026-10-06",
        estimatedMinutes: 120,
        created: "2026-10-04",
        completed: "2026-10-05",
        outcome: "Fixed it",
      },
    });
  });

  it("treats null and missing optional values as undefined", () => {
    const frontmatter = validFrontmatter();
    delete frontmatter["due"];
    delete frontmatter["estimated_minutes"];
    const result = taskFromFrontmatter(PATH, frontmatter);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.due).toBeUndefined();
      expect(result.value.estimatedMinutes).toBeUndefined();
      expect(result.value.completed).toBeUndefined();
      expect(result.value.outcome).toBeUndefined();
    }
  });

  it("treats a whitespace-only outcome as undefined", () => {
    const result = taskFromFrontmatter(PATH, validFrontmatter({ outcome: "   " }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBeUndefined();
    }
  });

  it("accepts a link with an alias", () => {
    const result = taskFromFrontmatter(
      PATH,
      validFrontmatter({ project: "[[MRI Reporting|MRI]]" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.projectLinkPath).toBe("MRI Reporting");
    }
  });
});

describe("taskFromFrontmatter: rejected input", () => {
  it("rejects undefined frontmatter", () => {
    expect(reasonOf(undefined)).toContain("Not a task note");
  });

  it("rejects another note type", () => {
    expect(reasonOf(validFrontmatter({ type: "project" }))).toContain(
      "Not a task note",
    );
  });

  it("rejects a missing project link", () => {
    expect(reasonOf(validFrontmatter({ project: undefined }))).toContain(
      "project link",
    );
  });

  it("rejects a project value that is not a wikilink", () => {
    expect(reasonOf(validFrontmatter({ project: "MRI Reporting" }))).toContain(
      "project link",
    );
  });

  it("rejects an unknown status", () => {
    expect(reasonOf(validFrontmatter({ status: "donee" }))).toContain("status");
  });

  it("rejects an unknown priority", () => {
    expect(reasonOf(validFrontmatter({ priority: "urgent" }))).toContain(
      "priority",
    );
  });

  it("rejects an impossible due date", () => {
    expect(reasonOf(validFrontmatter({ due: "2026-02-30" }))).toContain("due");
  });

  it.each([[0], [-5], [1.5], ["120"]])(
    "rejects estimated_minutes %j",
    (value) => {
      expect(reasonOf(validFrontmatter({ estimated_minutes: value }))).toContain(
        "estimated_minutes",
      );
    },
  );

  it("rejects a missing created date", () => {
    expect(reasonOf(validFrontmatter({ created: null }))).toContain("created");
  });

  it("rejects an invalid completed date", () => {
    expect(reasonOf(validFrontmatter({ completed: "yesterday" }))).toContain(
      "completed",
    );
  });

  it("rejects an outcome that is not text", () => {
    expect(reasonOf(validFrontmatter({ outcome: 5 }))).toContain("outcome");
  });
});

describe("taskToFrontmatter", () => {
  const input = {
    projectLink: "[[MRI Reporting]]",
    status: "not-started" as const,
    priority: "medium" as const,
    due: undefined,
    estimatedMinutes: undefined,
    created: "2026-10-05",
    completed: undefined,
    outcome: undefined,
  };

  it("writes every owned key, using null for absent values", () => {
    expect(taskToFrontmatter(input)).toEqual({
      type: "task",
      project: "[[MRI Reporting]]",
      created: "2026-10-05",
      status: "not-started",
      priority: "medium",
      due: null,
      estimated_minutes: null,
      completed: null,
      outcome: null,
    });
  });

  it("round trips through taskFromFrontmatter", () => {
    const written = taskToFrontmatter({
      ...input,
      status: "complete",
      due: "2026-10-06",
      estimatedMinutes: 90,
      completed: "2026-10-05",
      outcome: "Done",
    });
    const result = taskFromFrontmatter(PATH, written);
    expect(result).toEqual({
      ok: true,
      value: {
        path: PATH,
        name: "Fix mapping",
        projectLinkPath: "MRI Reporting",
        status: "complete",
        priority: "medium",
        due: "2026-10-06",
        estimatedMinutes: 90,
        created: "2026-10-05",
        completed: "2026-10-05",
        outcome: "Done",
      },
    });
  });
});

describe("taskMutableToFrontmatter", () => {
  it("does not include type, project or created", () => {
    const written = taskMutableToFrontmatter({
      status: "in-progress",
      priority: "high",
      due: undefined,
      estimatedMinutes: undefined,
      completed: undefined,
      outcome: undefined,
    });
    expect(Object.keys(written).sort()).toEqual([
      "completed",
      "due",
      "estimated_minutes",
      "outcome",
      "priority",
      "status",
    ]);
  });

  it("writes null for a cleared completed date", () => {
    const written = taskMutableToFrontmatter({
      status: "in-progress",
      priority: "high",
      due: undefined,
      estimatedMinutes: undefined,
      completed: undefined,
      outcome: undefined,
    });
    expect(written["completed"]).toBeNull();
  });
});