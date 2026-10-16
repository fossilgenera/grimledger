import { describe, expect, it } from "vitest";
import { focusCandidates } from "../../src/queries/focusCandidates";
import { makeClientRef, makeProject } from "./builders";

describe("focusCandidates", () => {
  it("includes active projects", () => {
    const result = focusCandidates([makeProject("Live")]);
    expect(result.map((c) => c.project.name)).toEqual(["Live"]);
  });

  it.each(["paused", "completed", "archived"] as const)(
    "leaves out a %s project that is not flagged",
    (status) => {
      expect(focusCandidates([makeProject("Quiet", { status })])).toEqual([]);
    },
  );

  it.each(["paused", "completed", "archived"] as const)(
    "includes a %s project that is still flagged, so the flag can be cleared",
    (status) => {
      const result = focusCandidates([
        makeProject("Stale", { status, currentFocus: true }),
      ]);
      expect(result.map((c) => c.project.name)).toEqual(["Stale"]);
    },
  );

  it("labels a project Client / Project", () => {
    const result = focusCandidates([makeProject("MRI Reporting")]);
    expect(result.map((c) => c.label)).toEqual(["ABC Bank / MRI Reporting"]);
  });

  it("adds (current focus) to a flagged project", () => {
    const result = focusCandidates([
      makeProject("MRI Reporting", { currentFocus: true }),
    ]);
    expect(result.map((c) => c.label)).toEqual([
      "ABC Bank / MRI Reporting (current focus)",
    ]);
  });

  it("sorts by client name, then project name", () => {
    const abc = makeClientRef("ABC Bank");
    const xyz = makeClientRef("XYZ Financial");
    const result = focusCandidates([
      makeProject("Beta", { client: xyz }),
      makeProject("Zeta", { client: abc }),
      makeProject("Alpha", { client: xyz }),
      makeProject("Gamma", { client: abc }),
    ]);
    expect(result.map((c) => c.label)).toEqual([
      "ABC Bank / Gamma",
      "ABC Bank / Zeta",
      "XYZ Financial / Alpha",
      "XYZ Financial / Beta",
    ]);
  });

  it("keeps same-named projects under different clients apart", () => {
    const abc = makeClientRef("ABC Bank");
    const xyz = makeClientRef("XYZ Financial");
    const result = focusCandidates([
      makeProject("Reporting", { client: xyz }),
      makeProject("Reporting", { client: abc }),
    ]);
    expect(result.map((c) => c.label)).toEqual([
      "ABC Bank / Reporting",
      "XYZ Financial / Reporting",
    ]);
  });

  it("does not modify its input", () => {
    const projects = Object.freeze([makeProject("B"), makeProject("A")]);
    expect(() => focusCandidates(projects)).not.toThrow();
  });
});