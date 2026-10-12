import { Project } from "../domain/models/project";
import { Task } from "../domain/models/task";
import { EntityRef } from "../domain/types";
import { openTasks } from "./openTasks";
import { comparePriorityDescending, compareText } from "./sorting";

export interface ProjectOverview {
    project: Project;
    tasksRemaining: number;
}

export interface ClientGroup {
    client: EntityRef;
    projects: ProjectOverview[];
}

/** One pass over the tasks. project path -> number of open tasks. */
function openTaskCounts(tasks: readonly Task[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const task of openTasks(tasks)) {
        counts.set(task.project.path, (counts.get(task.project.path) ?? 0) + 1);
    }
    return counts;
}

function overviewOf(
    project: Project,
    counts: ReadonlyMap<string, number>,
): ProjectOverview {
    return { project, tasksRemaining: counts.get(project.path) ?? 0 };
}

function compareProjectsByName(a: Project, b:Project): number {
    return compareText(a.name, b.name) || compareText(a.path, b.path);
}

function compareClients(a: EntityRef, b: EntityRef): number {
    return compareText(a.name, b.name) || compareText(a.path, b.path);
}

/**
 * Active projects marked as current focus, highest priority first, then by
 * client name, then by project name.
 */
export function currentFocusProjects(
    projects: readonly Project[],
    tasks: readonly Task[],
): ProjectOverview[] {
    const counts = openTaskCounts(tasks);
    return projects
        .filter((project) => project.status === "active" && project.currentFocus)
        .map((project) => overviewOf(project, counts))
        .sort(
            (a, b) =>
                comparePriorityDescending(a.project.priority, b.project.priority) ||
                compareClients(a.project.client, b.project.client) ||
                compareProjectsByName(a.project, b.project),
        );
}

/** 
 * Active projects grouped by client. Clients and projects ordered by name. Clients
 * with no active projects do not appear.
 */
export function activeProjectsByClient(
    projects: readonly Project[],
    tasks: readonly Task[]
): ClientGroup[] {
    const counts = openTaskCounts(tasks);
    const groups = new Map<string, ClientGroup>();

    for (const project of projects) {
        if (project.status !== "active") continue;
        let group = groups.get(project.client.path);
        if (group === undefined) {
            group = { client: project.client, projects: [] };
            groups.set(project.client.path, group);
        }
        group.projects.push(overviewOf(project, counts));
    }

    const result = [...groups.values()];
    for (const group of result) {
        group.projects.sort((a, b) => compareProjectsByName(a.project, b.project));
    }
    return result.sort((a, b) => compareClients(a.client, b.client));
}