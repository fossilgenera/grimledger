import { describe, expect, it } from "vitest";
import {
  dailyNoteBody,
  formatLongDate,
} from "../../../src/domain/rules/dailyNoteTemplate";

describe("formatLongDate", () => {
  it.each([
    ["2026-10-27", "Tuesday 27 October 2026"],
    ["2026-01-05", "Monday 5 January 2026"],
    ["2028-02-29", "Tuesday 29 February 2028"],
    ["2026-12-31", "Thursday 31 December 2026"],
  ])("%s is %s", (date, expected) => {
    expect(formatLongDate(date)).toBe(expected);
  });

  it("throws on an invalid date", () => {
    expect(() => formatLongDate("2026-02-30")).toThrow();
  });
});

describe("dailyNoteBody", () => {
  const body = dailyNoteBody("2026-10-27");

  it("starts with the long date as a title", () => {
    expect(body.startsWith("# Tuesday 27 October 2026\n")).toBe(true);
  });

  it("has the six sections, in order", () => {
    const headings = [...body.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
    expect(headings).toEqual([
      "Plan",
      "Work log",
      "Learned",
      "Wins",
      "Notes",
      "Tomorrow",
    ]);
  });

  it("contains no task headings and no complete links", () => {
    expect(body).not.toMatch(/^### /m);
    expect(body).not.toMatch(/\[\[[^\]]*\]\]/);
  });

  it("has no properties block of its own", () => {
    expect(body).not.toMatch(/^---$/m);
  });

  it("ends with a newline", () => {
    expect(body.endsWith("\n")).toBe(true);
  });

  it("throws for an invalid date", () => {
    expect(() => dailyNoteBody("2026-02-30")).toThrow();
  });
});
