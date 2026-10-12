import type { Project } from "../../src/domain/models/project";
import type { Task } from "../../src/domain/models/task";
import type { EntityRef } from "../../src/domain/types";

function folderOf(path: string): string {
  return path.substring(0, path.lastIndexOf("/"));
}

export function refOf(entity: EntityRef): EntityRef {
  return { path: entity.path, name: entity.name };
}

export function makeClientRef(name: string): EntityRef {
  return { path: `Work/Clients/${name}/${name}.md`, name };
}

export function makeProject(
  name: string,
  overrides: Partial<Project> = {},
): Project {
  const client = overrides.client ?? makeClientRef("ABC Bank");
  return {
    path: `${folderOf(client.path)}/Projects/${name}/${name}.md`,
    name,
    client,
    status: "active",
    priority: "medium",
    startDate: undefined,
    currentFocus: false,
    ...overrides,
  };
}

export function makeTask(name: string, overrides: Partial<Task> = {}): Task {
  const project = overrides.project ?? refOf(makeProject("MRI Reporting"));
  return {
    path: `${folderOf(project.path)}/Tasks/${name}.md`,
    name,
    project,
    status: "not-started",
    priority: "medium",
    due: undefined,
    estimatedMinutes: undefined,
    created: "2026-10-01",
    completed: undefined,
    outcome: undefined,
    ...overrides,
  };
}