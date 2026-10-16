import type { Project } from "../models/project";
import { fail, ok, Result } from "../result";

/**
 * Marks or clears a project's current-focus flag. Only active projects can be marked, because the dashboard shows current focus
 * for active projects only. Clearing is always allowed, so a stale flag on a paused project can be removed.
 * Returns a new project and never changes its input.
 */
export function applyCurrentFocus(project: Project, value: boolean): Result<Project> {
    if (value && project.status !== "active") {
        return fail(
            `Only active projects can be current focus. "${project.name}" is ${project.status}.`,
        );
    }
    return ok({ ...project, currentFocus: value });
}