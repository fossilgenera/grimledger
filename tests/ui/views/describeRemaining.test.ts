import { describe, expect, it } from "vitest";
import { describeRemaining } from "../../../src/ui/views/describeRemaining";

describe("describeRemaining", () => {
  it("says No tasks remaining for zero", () => {
    expect(describeRemaining(0)).toBe("No tasks remaining");
  });

  it("uses the singular for one", () => {
    expect(describeRemaining(1)).toBe("1 task remaining");
  });

  it.each([
    [2, "2 tasks remaining"],
    [10, "10 tasks remaining"],
    [125, "125 tasks remaining"],
  ])("uses the plural for %i", (count, expected) => {
    expect(describeRemaining(count)).toBe(expected);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "throws for the invalid count %s",
    (bad) => {
      expect(() => describeRemaining(bad)).toThrow();
    },
  );
});