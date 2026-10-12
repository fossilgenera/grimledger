import { describe, expect, it } from "vitest";
import { addDays } from "../../../src/domain/rules/isoDate";

describe("addDays", () => {
  it.each([
    ["2026-10-12", 0, "2026-10-12"],
    ["2026-10-12", 3, "2026-10-15"],
    ["2026-10-30", 3, "2026-11-02"],
    ["2026-12-30", 5, "2027-01-04"],
    ["2026-01-01", 365, "2027-01-01"],
    ["2028-01-01", 366, "2029-01-01"],
  ])("addDays(%s, %i) is %s", (start, days, expected) => {
    expect(addDays(start, days)).toBe(expected);
  });

  it.each([
    ["2028-02-28", 1, "2028-02-29"],
    ["2026-02-28", 1, "2026-03-01"],
  ])("handles leap years: addDays(%s, %i) is %s", (start, days, expected) => {
    expect(addDays(start, days)).toBe(expected);
  });

  it.each([
    ["2026-03-01", -1, "2026-02-28"],
    ["2026-01-01", -1, "2025-12-31"],
    ["2026-10-12", -12, "2026-09-30"],
  ])("subtracts days: addDays(%s, %i) is %s", (start, days, expected) => {
    expect(addDays(start, days)).toBe(expected);
  });

  it.each([
    ["2026-03-07", 2, "2026-03-09"],
    ["2026-03-28", 2, "2026-03-30"],
    ["2026-10-24", 3, "2026-10-27"],
    ["2026-10-31", 2, "2026-11-02"],
  ])(
    "is not affected by daylight saving changes: addDays(%s, %i) is %s",
    (start, days, expected) => {
      expect(addDays(start, days)).toBe(expected);
    },
  );

  it.each(["", "not a date", "2026-1-1", "2026-13-01", "2026-02-30", "2026-02-29", "2026-10-12T00:00"])(
    "throws for the invalid date %j",
    (bad) => {
      expect(() => addDays(bad, 1)).toThrow();
    },
  );

  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "throws for the invalid day count %s",
    (bad) => {
      expect(() => addDays("2026-10-12", bad)).toThrow();
    },
  );
});