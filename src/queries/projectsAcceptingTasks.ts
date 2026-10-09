import type { Project } from "../domain/models/project";

function compareForDisplay(a: Project, b: Project): number {
    return (
        a.client.name.localeCompare(b.client.name) ||
        a.name.localeCompare(b.name) ||
        a.path.localeCompare(b.path)
    );
}

export function projectsAcceptingTasks(projects: readonly Project[]): Project[] {
    return projects
        .filter((project) => project.status === "active" || project.status === "paused")
        .sort(compareForDisplay);
}