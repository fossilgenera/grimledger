import type { Project } from "../domain/models/project";
import { compareText } from "./sorting";

export interface FocusCandidate {
    project: Project;
    /** For display and search */
    label: string;
}

function labelOf(project: Project): string {
    const base = `${project.client.name} / ${project.name}`;
    return project.currentFocus ? `${base} (current focus)` : base;
}

/**
 * Projects the toggle command offers: active projects, plus any project that is already
 * flagged whatever its status, so a stale flag can be cleared.
 */
export function focusCandidates(projects: readonly Project[]): FocusCandidate[] {
    return projects
        .filter((project) => project.status === "active" || project.currentFocus)
        .map((project): FocusCandidate => ({ project, label: labelOf(project) }))
        .sort(
            (a, b) =>
                compareText(a.project.client.name, b.project.client.name) ||
                compareText(a.project.name, b.project.name) ||
                compareText(a.project.path, b.project.path),
        );
}