import type { ProjectRepository } from "../data/repositories/ProjectRepository";
import type { Project } from "../domain/models/project";
import { fail, type Result } from "../domain/result";
import { applyCurrentFocus } from "../domain/rules/currentFocus";

export class ProjectService {
    constructor(private readonly projects: ProjectRepository) {}

    /** Re-reads the project by path, applies the rule, then writes once. */
    async setCurrentFocus(
        projectPath: string,
        value: boolean,
    ): Promise<Result<Project>> {
        const found = this.projects.list().items.find((p) => p.path === projectPath);
        if (found === undefined) {
            return fail(`Project "${projectPath}" was not found.`);
        }

        const changed = applyCurrentFocus(found, value);
        if (!changed.ok) {
            return changed;
        }
        return this.projects.update(changed.value);
    }
}