import { describe, expect, it } from "vitest";
import {
  dailyNoteFromFrontmatter,
  dailyNoteToFrontmatter,
} from "../../../src/data/mapping/dailyNoteMapper";

const PATH = "Work/Daily/2026/2026-10-27.md";

function reasonOf(frontmatter: Record<string, unknown> | undefined): string {
  const result = dailyNoteFromFrontmatter(PATH, frontmatter);
  if (result.ok) {
    throw new Error("Expected a failure but the mapping succeeded");
  }
  return result.reason;
}

describe("dailyNoteFromFrontmatter", () => {
  it("maps a valid daily note", () => {
    expect(
      dailyNoteFromFrontmatter(PATH, { type: "daily_note", date: "2026-10-27" }),
    ).toEqual({
      ok: true,
      value: { path: PATH, name: "2026-10-27", date: "2026-10-27" },
    });
  });

  it("rejects undefined frontmatter and other types", () => {
    expect(reasonOf(undefined)).toContain("Not a daily note");
    expect(reasonOf({ type: "task", date: "2026-10-27" })).toContain(
      "Not a daily note",
    );
  });

  it("rejects a missing or empty date", () => {
    expect(reasonOf({ type: "daily_note" })).toContain("date");
    expect(reasonOf({ type: "daily_note", date: null })).toContain("date");
  });

  it("rejects an impossible date", () => {
    expect(reasonOf({ type: "daily_note", date: "2026-02-30" })).toContain("date");
  });

  it("takes the date from the property, not the file name", () => {
    const result = dailyNoteFromFrontmatter(PATH, {
      type: "daily_note",
      date: "2026-10-28",
    });
    expect(result.ok && result.value.date).toBe("2026-10-28");
  });
});

describe("dailyNoteToFrontmatter", () => {
  it("writes the type and the date", () => {
    expect(dailyNoteToFrontmatter("2026-10-27")).toEqual({
      type: "daily_note",
      date: "2026-10-27",
    });
  });

  it("round trips through dailyNoteFromFrontmatter", () => {
    const result = dailyNoteFromFrontmatter(PATH, dailyNoteToFrontmatter("2026-10-27"));
    expect(result.ok && result.value.date).toBe("2026-10-27");
  });
});