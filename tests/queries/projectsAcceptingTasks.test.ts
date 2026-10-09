import { describe, expect, it } from "vitest";
import type { Project } from "../../src/domain/models/project";
import { projectsAcceptingTasks } from "../../src/queries/projectsAcceptingTasks";
import type { ProjectStatus } from "../../src/domain/types";

function makeProject(
  clientName: string,
  projectName: string,
  status: ProjectStatus = "active",
): Project {
  return {
    path: `Work/Clients/${clientName}/Projects/${projectName}/${projectName}.md`,
    name: projectName,
    client: {
      path: `Work/Clients/${clientName}/${clientName}.md`,
      name: clientName,
    },
    status,
    priority: "medium",
    startDate: undefined,
    currentFocus: false,
  };
}

const STATUS_CASES: ReadonlyArray<readonly [ProjectStatus, boolean]> = [
  ["active", true],
  ["paused", true],
  ["completed", false],
  ["archived", false],
];

describe("projectsAcceptingTasks", () => {
  for (const [status, kept] of STATUS_CASES) {
    it(`${kept ? "keeps" : "drops"} a ${status} project`, () => {
      const result = projectsAcceptingTasks([makeProject("A", "P", status)]);
      expect(result).toHaveLength(kept ? 1 : 0);
    });
  }

  it("returns an empty list for an empty input", () => {
    expect(projectsAcceptingTasks([])).toEqual([]);
  });

  it("sorts by client name, then project name", () => {
    const result = projectsAcceptingTasks([
      makeProject("B", "Zeta"),
      makeProject("A", "Beta"),
      makeProject("A", "Alpha"),
    ]);
    expect(result.map((p) => `${p.client.name}/${p.name}`)).toEqual([
      "A/Alpha",
      "A/Beta",
      "B/Zeta",
    ]);
  });

  it("orders identical labels by path so the result is stable", () => {
    const later = { ...makeProject("A", "P"), path: "z.md" };
    const earlier = { ...makeProject("A", "P"), path: "a.md" };
    const result = projectsAcceptingTasks([later, earlier]);
    expect(result.map((p) => p.path)).toEqual(["a.md", "z.md"]);
  });

  it("does not reorder or modify the input array", () => {
    const input = [makeProject("B", "Zeta"), makeProject("A", "Alpha")];
    projectsAcceptingTasks(input);
    expect(input.map((p) => p.name)).toEqual(["Zeta", "Alpha"]);
  });
});