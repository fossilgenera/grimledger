import { describe, expect, it } from "vitest";
import {
  blockerFromFrontmatter,
  blockerToFrontmatter,
} from "../../../src/data/mapping/blockerMapper";

const PATH =
  "Work/Clients/ABC Bank/Projects/MRI Reporting/Blockers/2026-10-04 Fix mapping.md";

function validFrontmatter(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    type: "blocker",
    task: "[[Fix mapping]]",
    since: "2026-10-04",
    until: "2026-10-06",
    blocked_by: "Client",
    waiting_on: "Production credentials",
    ...overrides,
  };
}

function reasonOf(frontmatter: Record<string, unknown> | undefined): string {
  const result = blockerFromFrontmatter(PATH, frontmatter);
  if (result.ok) {
    throw new Error("Expected a failure but the mapping succeeded");
  }
  return result.reason;
}

describe("blockerFromFrontmatter", () => {
  it("maps a valid blocker", () => {
    expect(blockerFromFrontmatter(PATH, validFrontmatter())).toEqual({
      ok: true,
      value: {
        path: PATH,
        name: "2026-10-04 Fix mapping",
        taskLinkPath: "Fix mapping",
        since: "2026-10-04",
        until: "2026-10-06",
        blockedBy: "Client",
        waitingOn: "Production credentials",
      },
    });
  });

  it("treats null optional values as undefined", () => {
    const result = blockerFromFrontmatter(
      PATH,
      validFrontmatter({ blocked_by: null, waiting_on: null }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.blockedBy).toBeUndefined();
      expect(result.value.waitingOn).toBeUndefined();
    }
  });

  it("accepts a block that starts and ends on the same day", () => {
    expect(
      blockerFromFrontmatter(PATH, validFrontmatter({ until: "2026-10-04" }))
        .ok,
    ).toBe(true);
  });

  it("rejects undefined frontmatter and other types", () => {
    expect(reasonOf(undefined)).toContain("Not a blocker note");
    expect(reasonOf(validFrontmatter({ type: "task" }))).toContain(
      "Not a blocker note",
    );
  });

  it("rejects a bad task link", () => {
    expect(reasonOf(validFrontmatter({ task: "Fix mapping" }))).toContain(
      "task link",
    );
  });

  it("rejects missing or invalid dates", () => {
    expect(reasonOf(validFrontmatter({ since: null }))).toContain("since");
    expect(reasonOf(validFrontmatter({ until: null }))).toContain("until");
    expect(reasonOf(validFrontmatter({ since: "2026-02-30" }))).toContain(
      "since",
    );
  });

  it("rejects an end before the start", () => {
    expect(reasonOf(validFrontmatter({ until: "2026-10-01" }))).toContain(
      "until",
    );
  });

  it("rejects optional text that is not text", () => {
    expect(reasonOf(validFrontmatter({ waiting_on: 5 }))).toContain(
      "waiting_on",
    );
  });
});

describe("blockerToFrontmatter", () => {
  const input = {
    taskLink: "[[Fix mapping]]",
    since: "2026-10-04",
    until: "2026-10-06",
    blockedBy: undefined,
    waitingOn: undefined,
  };

  it("writes every owned key, using null for absent values", () => {
    expect(blockerToFrontmatter(input)).toEqual({
      type: "blocker",
      task: "[[Fix mapping]]",
      since: "2026-10-04",
      until: "2026-10-06",
      blocked_by: null,
      waiting_on: null,
    });
  });

  it("round trips through blockerFromFrontmatter", () => {
    const written = blockerToFrontmatter({
      ...input,
      blockedBy: "Client",
      waitingOn: "Credentials",
    });
    expect(blockerFromFrontmatter(PATH, written)).toEqual({
      ok: true,
      value: {
        path: PATH,
        name: "2026-10-04 Fix mapping",
        taskLinkPath: "Fix mapping",
        since: "2026-10-04",
        until: "2026-10-06",
        blockedBy: "Client",
        waitingOn: "Credentials",
      },
    });
  });
});
