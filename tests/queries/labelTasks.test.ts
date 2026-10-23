import { describe, expect, it } from "vitest";
import type { Project } from "../../src/domain/models/project";
import type { Task } from "../../src/domain/models/task";
import { labelTasks } from "../../src/queries/labelTasks";

function makeProject(clientName: string, projectName: string): Project {
  return {
    path: `Work/Clients/${clientName}/Projects/${projectName}/${projectName}.md`,
    name: projectName,
    client: {
      path: `Work/Clients/${clientName}/${clientName}.md`,
      name: clientName,
    },
    status: "active",
    priority: "medium",
    startDate: undefined,
    currentFocus: false,
  };
}

function makeTask(project: Project, name: string): Task {
  return {
    path: `${project.path.replace(`${project.name}.md`, "")}Tasks/${name}.md`,
    name,
    project: { path: project.path, name: project.name },
    status: "not-started",
    priority: "medium",
    due: undefined,
    estimatedMinutes: undefined,
    created: "2026-10-01",
    completed: undefined,
    outcome: undefined,
    blockedSince: undefined,
    blockedBy: undefined,
    waitingOn: undefined,
    expectedResolution: undefined,
    recurrence: undefined,
  };
}

describe("labelTasks", () => {
  it("labels a task as client / project / task", () => {
    const project = makeProject("ABC Bank", "MRI Reporting");
    const result = labelTasks([makeTask(project, "Fix mapping")], [project]);
    expect(result).toHaveLength(1);
    expect(result[0]?.label).toBe("ABC Bank / MRI Reporting / Fix mapping");
  });

  it("keeps the original task object in each result", () => {
    const project = makeProject("ABC Bank", "MRI Reporting");
    const task = makeTask(project, "Fix mapping");
    expect(labelTasks([task], [project])[0]?.task).toBe(task);
  });

  it("separates same-named projects under different clients", () => {
    const a = makeProject("ABC Bank", "Reporting");
    const b = makeProject("XYZ Financial", "Reporting");
    const result = labelTasks(
      [makeTask(a, "Review"), makeTask(b, "Review")],
      [a, b],
    );
    expect(result.map((r) => r.label)).toEqual([
      "ABC Bank / Reporting / Review",
      "XYZ Financial / Reporting / Review",
    ]);
  });

  it("drops the client part when the project is not in the list", () => {
    const project = makeProject("ABC Bank", "MRI Reporting");
    const result = labelTasks([makeTask(project, "Fix mapping")], []);
    expect(result[0]?.label).toBe("MRI Reporting / Fix mapping");
  });

  it("sorts by label", () => {
    const project = makeProject("ABC Bank", "MRI Reporting");
    const result = labelTasks(
      [makeTask(project, "Zeta"), makeTask(project, "Alpha")],
      [project],
    );
    expect(result.map((r) => r.task.name)).toEqual(["Alpha", "Zeta"]);
  });

  it("returns an empty list for no tasks", () => {
    expect(labelTasks([], [])).toEqual([]);
  });

  it("does not reorder or modify the input arrays", () => {
    const project = makeProject("ABC Bank", "MRI Reporting");
    const tasks = [makeTask(project, "Zeta"), makeTask(project, "Alpha")];
    labelTasks(tasks, [project]);
    expect(tasks.map((t) => t.name)).toEqual(["Zeta", "Alpha"]);
  });
});