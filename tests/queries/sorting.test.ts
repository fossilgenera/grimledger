import { describe, expect, it } from "vitest";
import { comparePriorityDescending, compareText } from "../../src/queries/sorting";

describe("compareText", () => {
  it("orders alphabetically", () => {
    expect(compareText("a", "b")).toBeLessThan(0);
    expect(compareText("b", "a")).toBeGreaterThan(0);
  });

  it("ignores case", () => {
    expect(compareText("abc", "ABC")).toBe(0);
    expect(compareText("a", "B")).toBeLessThan(0);
    expect(compareText("B", "a")).toBeGreaterThan(0);
  });

  it("returns 0 for identical text", () => {
    expect(compareText("same", "same")).toBe(0);
  });
});

describe("comparePriorityDescending", () => {
  it("puts higher priorities first", () => {
    expect(comparePriorityDescending("critical", "low")).toBeLessThan(0);
    expect(comparePriorityDescending("low", "critical")).toBeGreaterThan(0);
    expect(comparePriorityDescending("high", "medium")).toBeLessThan(0);
  });

  it("returns 0 for equal priorities", () => {
    expect(comparePriorityDescending("medium", "medium")).toBe(0);
  });
});