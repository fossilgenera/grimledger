import { describe, expect, it } from "vitest";
import {
  activeProjectsByClient,
  currentFocusProjects,
} from "../../src/queries/projectOverview";
import { makeClientRef, makeProject, makeTask, refOf } from "./builders";

describe("currentFocusProjects", () => {
  it("returns only active projects marked as current focus", () => {
    const projects = [
      makeProject("Focused", { currentFocus: true }),
      makeProject("Not focused", { currentFocus: false }),
      makeProject("Paused focus", { currentFocus: true, status: "paused" }),
      makeProject("Completed focus", { currentFocus: true, status: "completed" }),
      makeProject("Archived focus", { currentFocus: true, status: "archived" }),
    ];
    const result = currentFocusProjects(projects, []);
    expect(result.map((o) => o.project.name)).toEqual(["Focused"]);
  });

  it("counts open tasks for the project as tasks remaining", () => {
    const project = makeProject("Focused", { currentFocus: true });
    const other = makeProject("Other");
    const ref = refOf(project);
    const tasks = [
      makeTask("Not started", { project: ref, status: "not-started" }),
      makeTask("In progress", { project: ref, status: "in-progress" }),
      makeTask("Blocked", { project: ref, status: "blocked" }),
      makeTask("No due date", { project: ref }),
      makeTask("Done", { project: ref, status: "complete" }),
      makeTask("Dropped", { project: ref, status: "cancelled" }),
      makeTask("Elsewhere", { project: refOf(other) }),
    ];
    const result = currentFocusProjects([project], tasks);
    expect(result).toHaveLength(1);
    expect(result[0]?.tasksRemaining).toBe(4);
  });

  it("reports zero tasks remaining for a project with no tasks", () => {
    const project = makeProject("Empty", { currentFocus: true });
    const result = currentFocusProjects([project], []);
    expect(result[0]?.tasksRemaining).toBe(0);
  });

  it("sorts by priority (highest first), then client name, then project name", () => {
    const abc = makeClientRef("ABC Bank");
    const aaa = makeClientRef("AAA Corp");
    const xyz = makeClientRef("XYZ Financial");
    const projects = [
      makeProject("Gamma", { client: abc, priority: "high", currentFocus: true }),
      makeProject("Low one", { client: abc, priority: "low", currentFocus: true }),
      makeProject("Alpha", { client: xyz, priority: "critical", currentFocus: true }),
      makeProject("Beta", { client: abc, priority: "high", currentFocus: true }),
      makeProject("Zeta", { client: aaa, priority: "high", currentFocus: true }),
    ];
    const result = currentFocusProjects(projects, []);
    expect(result.map((o) => o.project.name)).toEqual([
      "Alpha",
      "Zeta",
      "Beta",
      "Gamma",
      "Low one",
    ]);
  });

  it("does not modify its input", () => {
    const projects = Object.freeze([
      makeProject("C", { currentFocus: true }),
      makeProject("A", { currentFocus: true }),
      makeProject("B", { currentFocus: true }),
    ]);
    expect(() => currentFocusProjects(projects, [])).not.toThrow();
  });
});

describe("activeProjectsByClient", () => {
  it("groups active projects by client", () => {
    const abc = makeClientRef("ABC Bank");
    const xyz = makeClientRef("XYZ Financial");
    const projects = [
      makeProject("MRI Reporting", { client: abc }),
      makeProject("Data Migration", { client: abc }),
      makeProject("API Integration", { client: xyz }),
    ];
    const result = activeProjectsByClient(projects, []);
    expect(
      result.map((group) => ({
        client: group.client.name,
        projects: group.projects.map((o) => o.project.name),
      })),
    ).toEqual([
      { client: "ABC Bank", projects: ["Data Migration", "MRI Reporting"] },
      { client: "XYZ Financial", projects: ["API Integration"] },
    ]);
  });

  it("includes active projects whether or not they are current focus", () => {
    const projects = [
      makeProject("Focused", { currentFocus: true }),
      makeProject("Not focused", { currentFocus: false }),
    ];
    const result = activeProjectsByClient(projects, []);
    expect(result[0]?.projects).toHaveLength(2);
  });

  it("excludes projects that are not active and drops clients left with none", () => {
    const abc = makeClientRef("ABC Bank");
    const xyz = makeClientRef("XYZ Financial");
    const projects = [
      makeProject("Live", { client: abc }),
      makeProject("Paused", { client: abc, status: "paused" }),
      makeProject("Finished", { client: xyz, status: "completed" }),
      makeProject("Old", { client: xyz, status: "archived" }),
    ];
    const result = activeProjectsByClient(projects, []);
    expect(result.map((group) => group.client.name)).toEqual(["ABC Bank"]);
    expect(result[0]?.projects.map((o) => o.project.name)).toEqual(["Live"]);
  });

  it("keeps two clients with the same name in separate groups", () => {
    const first: { path: string; name: string } = {
      path: "Work/Clients/A/ABC Bank.md",
      name: "ABC Bank",
    };
    const second: { path: string; name: string } = {
      path: "Work/Clients/B/ABC Bank.md",
      name: "ABC Bank",
    };
    const projects = [
      makeProject("Reporting", { client: second }),
      makeProject("Migration", { client: first }),
    ];
    const result = activeProjectsByClient(projects, []);
    expect(result).toHaveLength(2);
    expect(result.map((group) => group.client.path)).toEqual([
      "Work/Clients/A/ABC Bank.md",
      "Work/Clients/B/ABC Bank.md",
    ]);
    expect(result[0]?.projects.map((o) => o.project.name)).toEqual(["Migration"]);
    expect(result[1]?.projects.map((o) => o.project.name)).toEqual(["Reporting"]);
  });

  it("includes tasks remaining for each project", () => {
    const busy = makeProject("Busy");
    const idle = makeProject("Idle");
    const tasks = [
      makeTask("One", { project: refOf(busy) }),
      makeTask("Two", { project: refOf(busy), status: "blocked" }),
      makeTask("Done", { project: refOf(busy), status: "complete" }),
    ];
    const result = activeProjectsByClient([busy, idle], tasks);
    const counts = result[0]?.projects.map((o) => [o.project.name, o.tasksRemaining]);
    expect(counts).toEqual([
      ["Busy", 2],
      ["Idle", 0],
    ]);
  });

  it("returns an empty list when there are no projects", () => {
    expect(activeProjectsByClient([], [])).toEqual([]);
  });

  it("does not modify its input", () => {
    const projects = Object.freeze([
      makeProject("C"),
      makeProject("A"),
      makeProject("B"),
    ]);
    expect(() => activeProjectsByClient(projects, [])).not.toThrow();
  });
});