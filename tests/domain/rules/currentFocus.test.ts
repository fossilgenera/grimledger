import { describe, expect, it } from "vitest";
import type { Result } from "../../../src/domain/result";
import { applyCurrentFocus } from "../../../src/domain/rules/currentFocus";
import { PROJECT_STATUSES } from "../../../src/domain/types";
import { makeProject } from "../../queries/builders";

function valueOf<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`Expected success, got: ${result.reason}`);
  return result.value;
}

function reasonOf(result: Result<unknown>): string {
  if (result.ok) throw new Error("Expected a failure, got a success.");
  return result.reason;
}

describe("applyCurrentFocus", () => {
  it("marks an active project", () => {
    const result = applyCurrentFocus(makeProject("MRI Reporting"), true);
    expect(valueOf(result).currentFocus).toBe(true);
  });

  it.each(["paused", "completed", "archived"] as const)(
    "refuses to mark a %s project",
    (status) => {
      const result = applyCurrentFocus(makeProject("MRI Reporting", { status }), true);
      expect(reasonOf(result)).toContain("active");
    },
  );

  it.each(PROJECT_STATUSES)("allows clearing the flag on a %s project", (status) => {
    const project = makeProject("MRI Reporting", { status, currentFocus: true });
    expect(valueOf(applyCurrentFocus(project, false)).currentFocus).toBe(false);
  });

  it.each([true, false])("succeeds unchanged when the flag is already %s", (flag) => {
    const project = makeProject("MRI Reporting", { currentFocus: flag });
    expect(valueOf(applyCurrentFocus(project, flag))).toEqual(project);
  });

  it("changes only the flag", () => {
    const project = makeProject("MRI Reporting", { priority: "critical" });
    expect(valueOf(applyCurrentFocus(project, true))).toEqual({
      ...project,
      currentFocus: true,
    });
  });

  it("returns a new object and leaves its input untouched", () => {
    const project = Object.freeze(makeProject("MRI Reporting"));
    const result = valueOf(applyCurrentFocus(project, true));
    expect(result).not.toBe(project);
    expect(project.currentFocus).toBe(false);
  });
});