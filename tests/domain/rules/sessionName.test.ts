import { describe, expect, it } from "vitest";
import { nextSessionName } from "../../../src/domain/rules/sessionName";

describe("nextSessionName", () => {
  it("uses the date and task name when nothing exists", () => {
    expect(nextSessionName("2026-10-04", "Fix mapping", [])).toBe(
      "2026-10-04 Fix mapping",
    );
  });

  it("adds 2 when the base name is taken", () => {
    expect(
      nextSessionName("2026-10-04", "Fix mapping", ["2026-10-04 Fix mapping"]),
    ).toBe("2026-10-04 Fix mapping 2");
  });

  it("adds 3 when the base name and 2 are taken", () => {
    expect(
      nextSessionName("2026-10-04", "Fix mapping", [
        "2026-10-04 Fix mapping",
        "2026-10-04 Fix mapping 2",
      ]),
    ).toBe("2026-10-04 Fix mapping 3");
  });

  it("fills the lowest free number when there is a gap", () => {
    expect(
      nextSessionName("2026-10-04", "Fix mapping", [
        "2026-10-04 Fix mapping",
        "2026-10-04 Fix mapping 3",
      ]),
    ).toBe("2026-10-04 Fix mapping 2");
  });

  it("ignores names for other dates and other tasks", () => {
    expect(
      nextSessionName("2026-10-04", "Fix mapping", [
        "2026-10-03 Fix mapping",
        "2026-10-04 Write report",
      ]),
    ).toBe("2026-10-04 Fix mapping");
  });

  it("treats names that differ only in letter case as taken", () => {
    expect(
      nextSessionName("2026-10-04", "Fix mapping", ["2026-10-04 fix mapping"]),
    ).toBe("2026-10-04 Fix mapping 2");
  });

  it("does not modify the list it is given", () => {
    const existing = Object.freeze(["2026-10-04 Fix mapping"]);
    expect(() =>
      nextSessionName("2026-10-04", "Fix mapping", existing),
    ).not.toThrow();
  });
});