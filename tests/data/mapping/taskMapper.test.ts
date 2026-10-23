import { describe, expect, it } from "vitest";
import {
  taskFromFrontmatter,
  taskMutableToFrontmatter,
  taskToFrontmatter,
} from "../../../src/data/mapping/taskMapper";

const PATH =
  "Work/Clients/ABC Bank/Projects/MRI Reporting/Tasks/Fix mapping.md";

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
    const result = taskFromFrontmatter(
      PATH,
      validFrontmatter({ outcome: "   " }),
    );
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
      expect(
        reasonOf(validFrontmatter({ estimated_minutes: value })),
      ).toContain("estimated_minutes");
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

const NO_BLOCKER = {
  blockedSince: undefined,
  blockedBy: undefined,
  waitingOn: undefined,
  expectedResolution: undefined,
};

describe("taskFromFrontmatter: blocked fields", () => {
  it("reads the blocked fields", () => {
    const result = taskFromFrontmatter(
      PATH,
      validFrontmatter({
        status: "blocked",
        blocked_since: "2026-10-04",
        blocked_by: " Client ",
        waiting_on: "Production credentials",
        expected_resolution: "2026-10-07",
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.blockedSince).toBe("2026-10-04");
      expect(result.value.blockedBy).toBe("Client");
      expect(result.value.waitingOn).toBe("Production credentials");
      expect(result.value.expectedResolution).toBe("2026-10-07");
    }
  });

  it("accepts a blocked task with no blocked fields", () => {
    const result = taskFromFrontmatter(
      PATH,
      validFrontmatter({ status: "blocked" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.blockedSince).toBeUndefined();
      expect(result.value.waitingOn).toBeUndefined();
    }
  });

  it.each([
    ["blocked_since", "yesterday"],
    ["expected_resolution", "2026-02-30"],
    ["blocked_by", 5],
    ["waiting_on", 5],
  ])("rejects an invalid %s", (key, value) => {
    expect(reasonOf(validFrontmatter({ [key]: value }))).toContain(key);
  });
});

describe("taskFromFrontmatter: recurrence", () => {
  it("reads a recurrence", () => {
    const result = taskFromFrontmatter(
      PATH,
      validFrontmatter({ recurrence_unit: "week", recurrence_every: 2 }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.recurrence).toEqual({ unit: "week", every: 2 });
    }
  });

  it("treats missing and null recurrence keys as no recurrence", () => {
    const missing = taskFromFrontmatter(PATH, validFrontmatter());
    const empty = taskFromFrontmatter(
      PATH,
      validFrontmatter({ recurrence_unit: null, recurrence_every: null }),
    );
    for (const result of [missing, empty]) {
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.recurrence).toBeUndefined();
      }
    }
  });

  it("rejects a recurrence with only one of the two keys", () => {
    expect(reasonOf(validFrontmatter({ recurrence_unit: "week" }))).toContain(
      "recurrence",
    );
    expect(reasonOf(validFrontmatter({ recurrence_every: 2 }))).toContain(
      "recurrence",
    );
  });

  it("rejects an unknown unit", () => {
    expect(
      reasonOf(
        validFrontmatter({ recurrence_unit: "year", recurrence_every: 1 }),
      ),
    ).toContain("recurrence");
  });

  it.each([[0], [-1], [1.5], ["2"], [1000]])(
    "rejects recurrence_every %j",
    (value) => {
      expect(
        reasonOf(
          validFrontmatter({ recurrence_unit: "day", recurrence_every: value }),
        ),
      ).toContain("recurrence");
    },
  );
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
    ...NO_BLOCKER,
    recurrence: undefined,
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
      blocked_since: null,
      blocked_by: null,
      waiting_on: null,
      expected_resolution: null,
      recurrence_unit: null,
      recurrence_every: null,
    });
  });

  it("writes the blocked fields and the recurrence", () => {
    const written = taskToFrontmatter({
      ...input,
      status: "blocked",
      blockedSince: "2026-10-04",
      blockedBy: "Client",
      waitingOn: "Production credentials",
      expectedResolution: "2026-10-07",
      recurrence: { unit: "week", every: 2 },
    });
    expect(written).toMatchObject({
      blocked_since: "2026-10-04",
      blocked_by: "Client",
      waiting_on: "Production credentials",
      expected_resolution: "2026-10-07",
      recurrence_unit: "week",
      recurrence_every: 2,
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

  it("round trips blocked fields and recurrence", () => {
    const written = taskToFrontmatter({
      ...input,
      status: "blocked",
      due: "2026-10-06",
      blockedSince: "2026-10-04",
      blockedBy: "Client",
      waitingOn: "Credentials",
      expectedResolution: "2026-10-07",
      recurrence: { unit: "month", every: 3 },
    });
    const result = taskFromFrontmatter(PATH, written);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.blockedSince).toBe("2026-10-04");
      expect(result.value.blockedBy).toBe("Client");
      expect(result.value.waitingOn).toBe("Credentials");
      expect(result.value.expectedResolution).toBe("2026-10-07");
      expect(result.value.recurrence).toEqual({ unit: "month", every: 3 });
    }
  });
});

describe("taskMutableToFrontmatter", () => {
  const blank = {
    status: "in-progress" as const,
    priority: "high" as const,
    due: undefined,
    estimatedMinutes: undefined,
    completed: undefined,
    outcome: undefined,
    ...NO_BLOCKER,
  };

  it("does not include type, project, created or recurrence", () => {
    expect(Object.keys(taskMutableToFrontmatter(blank)).sort()).toEqual([
      "blocked_by",
      "blocked_since",
      "completed",
      "due",
      "estimated_minutes",
      "expected_resolution",
      "outcome",
      "priority",
      "status",
      "waiting_on",
    ]);
  });

  it("writes null for cleared values", () => {
    const written = taskMutableToFrontmatter(blank);
    expect(written["completed"]).toBeNull();
    expect(written["blocked_since"]).toBeNull();
    expect(written["waiting_on"]).toBeNull();
  });

  it("writes the blocked fields when set", () => {
    const written = taskMutableToFrontmatter({
      ...blank,
      status: "blocked",
      blockedSince: "2026-10-04",
      blockedBy: "Client",
      waitingOn: "Credentials",
      expectedResolution: "2026-10-07",
    });
    expect(written["blocked_since"]).toBe("2026-10-04");
    expect(written["blocked_by"]).toBe("Client");
    expect(written["waiting_on"]).toBe("Credentials");
    expect(written["expected_resolution"]).toBe("2026-10-07");
  });
});
