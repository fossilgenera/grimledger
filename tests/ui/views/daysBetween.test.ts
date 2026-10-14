import { describe, expect, it } from "vitest";
import { addDays, daysBetween } from "../../../src/domain/rules/isoDate";

describe("daysBetween", () => {
  it.each([
    ["2026-10-12", "2026-10-12", 0],
    ["2026-10-12", "2026-10-13", 1],
    ["2026-10-12", "2026-10-15", 3],
    ["2026-10-15", "2026-10-12", -3],
    ["2026-10-30", "2026-11-02", 3],
    ["2026-12-30", "2027-01-04", 5],
    ["2027-01-04", "2026-12-30", -5],
  ])("daysBetween(%s, %s) is %i", (from, to, expected) => {
    expect(daysBetween(from, to)).toBe(expected);
  });

  it.each([
    ["2028-02-28", "2028-03-01", 2],
    ["2026-02-28", "2026-03-01", 1],
    ["2026-01-01", "2027-01-01", 365],
    ["2028-01-01", "2029-01-01", 366],
  ])("handles leap years: daysBetween(%s, %s) is %i", (from, to, expected) => {
    expect(daysBetween(from, to)).toBe(expected);
  });

  it.each([
    ["2026-03-07", "2026-03-09", 2],
    ["2026-03-28", "2026-03-30", 2],
    ["2026-10-24", "2026-10-27", 3],
    ["2026-10-31", "2026-11-02", 2],
  ])(
    "is not affected by daylight saving changes: daysBetween(%s, %s) is %i",
    (from, to, expected) => {
      expect(daysBetween(from, to)).toBe(expected);
    },
  );

  it.each(["", "not a date", "2026-1-1", "2026-13-01", "2026-02-30"])(
    "throws when the first date is invalid: %j",
    (bad) => {
      expect(() => daysBetween(bad, "2026-10-12")).toThrow();
    },
  );

  it.each(["", "not a date", "2026-1-1", "2026-13-01", "2026-02-30"])(
    "throws when the second date is invalid: %j",
    (bad) => {
      expect(() => daysBetween("2026-10-12", bad)).toThrow();
    },
  );
});

describe("daysBetween and addDays are inverses", () => {
  const starts = ["2026-10-12", "2026-12-30", "2028-02-28", "2026-03-07"];
  const offsets = [-400, -31, -1, 0, 1, 7, 31, 400];

  for (const start of starts) {
    for (const offset of offsets) {
      it(`${start} plus ${offset} days`, () => {
        expect(daysBetween(start, addDays(start, offset))).toBe(offset);
      });
    }
  }
});