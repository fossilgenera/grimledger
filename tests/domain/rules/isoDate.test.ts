import { describe, expect, it } from "vitest";
import { formatIsoDate } from "../../../src/domain/rules/isoDate";

// Every date below is built from local parts (year, month index, day, ...),
// so these tests pass in any time zone. The edge-of-day cases are the ones
// that toISOString() would get wrong away from UTC.
describe("formatIsoDate", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(formatIsoDate(new Date(2026, 9, 5))).toBe("2026-10-05");
  });

  it("pads a single-digit month and day", () => {
    expect(formatIsoDate(new Date(2026, 0, 3))).toBe("2026-01-03");
  });

  it("uses the local day just after midnight", () => {
    expect(formatIsoDate(new Date(2026, 9, 5, 0, 0, 1))).toBe("2026-10-05");
  });

  it("uses the local day just before midnight", () => {
    expect(formatIsoDate(new Date(2026, 9, 5, 23, 59, 59))).toBe("2026-10-05");
  });

  it("handles the last day of the year", () => {
    expect(formatIsoDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});