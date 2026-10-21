import { describe, expect, it } from "vitest";
import {
  addMonths,
  nextDueDate,
  nextOccurrenceName,
  validateRecurrence,
} from "../../../src/domain/rules/recurrence";

describe("addMonths", () => {
  it("adds months within the same year", () => {
    expect(addMonths("2026-01-15", 1)).toBe("2026-02-15");
  });

  it("rolls over the year end", () => {
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
  });

  it("clamps to the last day of a shorter month", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-10-31", 4)).toBe("2027-02-28");
    expect(addMonths("2026-03-31", 1)).toBe("2026-04-30");
  });

  it("uses 29 February in a leap year", () => {
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
  });

  it("clamps 29 February when moving to a non-leap year", () => {
    expect(addMonths("2028-02-29", 12)).toBe("2029-02-28");
  });

  it("returns the same date for zero months", () => {
    expect(addMonths("2026-10-04", 0)).toBe("2026-10-04");
  });

  it("handles negative months", () => {
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-15");
  });

  it("handles many months at once", () => {
    expect(addMonths("2026-10-04", 24)).toBe("2028-10-04");
  });

  it("throws on an invalid date", () => {
    expect(() => addMonths("2026-02-30", 1)).toThrow();
    expect(() => addMonths("not a date", 1)).toThrow();
  });

  it("throws on a non-integer month count", () => {
    expect(() => addMonths("2026-10-04", 1.5)).toThrow();
  });
});

describe("validateRecurrence", () => {
  it("accepts a valid unit and interval", () => {
    expect(validateRecurrence("week", 1)).toEqual({
      ok: true,
      value: { unit: "week", every: 1 },
    });
    expect(validateRecurrence("month", 999).ok).toBe(true);
  });

  it("rejects an unknown unit", () => {
    const result = validateRecurrence("year", 1);
    expect(result.ok).toBe(false);
  });

  it("rejects an interval that is not a positive whole number", () => {
    expect(validateRecurrence("day", 0).ok).toBe(false);
    expect(validateRecurrence("day", -2).ok).toBe(false);
    expect(validateRecurrence("day", 1.5).ok).toBe(false);
    expect(validateRecurrence("day", "2").ok).toBe(false);
    expect(validateRecurrence("day", undefined).ok).toBe(false);
  });

  it("rejects an interval above 999", () => {
    expect(validateRecurrence("day", 1000).ok).toBe(false);
  });

  it("gives a reason on failure", () => {
    const result = validateRecurrence("year", 1);
    if (result.ok) throw new Error("expected failure");
    expect(result.reason.length).toBeGreaterThan(0);
  });
});

describe("nextDueDate", () => {
  const weekly = { unit: "week", every: 1 } as const;
  const daily = { unit: "day", every: 1 } as const;
  const monthly = { unit: "month", every: 1 } as const;

  it("adds the interval to the previous due date", () => {
    expect(nextDueDate("2026-10-02", weekly, "2026-10-04")).toBe("2026-10-09");
  });

  it("stays on the schedule when completed early", () => {
    expect(nextDueDate("2026-10-09", weekly, "2026-10-04")).toBe("2026-10-16");
  });

  it("moves a daily task due today to tomorrow", () => {
    expect(nextDueDate("2026-10-04", daily, "2026-10-04")).toBe("2026-10-05");
  });

  it("skips occurrences that would not be after today", () => {
    expect(nextDueDate("2026-09-04", weekly, "2026-10-04")).toBe("2026-10-09");
  });

  it("skips a candidate that falls exactly on today", () => {
    expect(nextDueDate("2026-09-27", weekly, "2026-10-04")).toBe("2026-10-11");
  });

  it("supports custom intervals", () => {
    expect(
      nextDueDate("2026-10-02", { unit: "week", every: 2 }, "2026-10-02"),
    ).toBe("2026-10-16");
    expect(
      nextDueDate("2026-11-15", { unit: "month", every: 3 }, "2026-11-15"),
    ).toBe("2027-02-15");
    expect(
      nextDueDate("2026-10-01", { unit: "day", every: 3 }, "2026-10-01"),
    ).toBe("2026-10-04");
  });

  it("clamps month ends", () => {
    expect(nextDueDate("2026-01-31", monthly, "2026-01-31")).toBe("2026-02-28");
  });

  it("handles a task that is years overdue", () => {
    expect(nextDueDate("2020-01-06", weekly, "2026-10-04")).toBe("2026-10-05");
  });

  it("throws on an invalid recurrence", () => {
    expect(() =>
      nextDueDate("2026-10-04", { unit: "day", every: 0 }, "2026-10-04"),
    ).toThrow();
  });
});

describe("nextOccurrenceName", () => {
  it("appends the due date to a plain name", () => {
    expect(nextOccurrenceName("Weekly update", "2026-10-09")).toBe(
      "Weekly update 2026-10-09",
    );
  });

  it("replaces a trailing date", () => {
    expect(nextOccurrenceName("Weekly update 2026-10-02", "2026-10-09")).toBe(
      "Weekly update 2026-10-09",
    );
  });

  it("leaves a date in the middle of the name alone", () => {
    expect(nextOccurrenceName("Report 2026-10-02 final", "2026-10-09")).toBe(
      "Report 2026-10-02 final 2026-10-09",
    );
  });

  it("trims surrounding whitespace", () => {
    expect(nextOccurrenceName("  Weekly update  ", "2026-10-09")).toBe(
      "Weekly update 2026-10-09",
    );
  });

  it("does not strip a name that is only a date", () => {
    expect(nextOccurrenceName("2026-10-02", "2026-10-09")).toBe(
      "2026-10-02 2026-10-09",
    );
  });
});
