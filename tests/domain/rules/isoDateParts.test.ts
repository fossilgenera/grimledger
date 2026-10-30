import { describe, expect, it } from "vitest";
import { dayOfWeek, isIsoDate } from "../../../src/domain/rules/isoDate";

describe("isIsoDate", () => {
  it.each(["2026-10-27", "2028-02-29", "2000-01-01"])("accepts %s", (text) => {
    expect(isIsoDate(text)).toBe(true);
  });

  it.each([
    "2026-02-30",
    "2027-02-29",
    "2026-1-5",
    "2026-13-01",
    "",
    "not a date",
    "2026-10-27 ",
  ])("rejects %j", (text) => {
    expect(isIsoDate(text)).toBe(false);
  });
});

describe("dayOfWeek", () => {
  it.each([
    ["2026-10-25", 0],
    ["2026-10-26", 1],
    ["2026-10-27", 2],
    ["2024-02-29", 4],
    ["2026-10-23", 5],
    ["2026-10-31", 6],
    ["2000-01-01", 6],
  ])("%s is day %i", (date, expected) => {
    expect(dayOfWeek(date)).toBe(expected);
  });

  it("throws on an invalid date", () => {
    expect(() => dayOfWeek("2026-02-30")).toThrow();
  });
});
