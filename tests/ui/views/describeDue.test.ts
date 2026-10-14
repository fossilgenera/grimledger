import { describe, expect, it } from "vitest";
import { describeDue } from "../../../src/ui/views/describeDue";

const TODAY = "2026-10-12";

describe("describeDue", () => {
  it("returns empty text when there is no due date", () => {
    expect(describeDue(undefined, TODAY)).toBe("");
  });

  it("says Today for the same day", () => {
    expect(describeDue("2026-10-12", TODAY)).toBe("Today");
  });

  it("says Tomorrow for the next day", () => {
    expect(describeDue("2026-10-13", TODAY)).toBe("Tomorrow");
  });

  it("says Tomorrow across a month boundary", () => {
    expect(describeDue("2026-11-01", "2026-10-31")).toBe("Tomorrow");
  });

  it("uses the singular for one day overdue", () => {
    expect(describeDue("2026-10-11", TODAY)).toBe("1 day overdue");
  });

  it.each([
    ["2026-10-09", "3 days overdue"],
    ["2026-09-27", "15 days overdue"],
    ["2026-08-28", "45 days overdue"],
  ])("says how many days overdue: %s is %s", (due, expected) => {
    expect(describeDue(due, TODAY)).toBe(expected);
  });

  it("counts overdue days across a month boundary", () => {
    expect(describeDue("2026-10-30", "2026-11-02")).toBe("3 days overdue");
  });

  it.each(["2026-10-14", "2026-10-19", "2027-01-05"])(
    "shows the ISO date for anything after tomorrow: %s",
    (due) => {
      expect(describeDue(due, TODAY)).toBe(due);
    },
  );
});