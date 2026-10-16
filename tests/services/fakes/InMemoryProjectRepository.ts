import type { ListResult } from "../../../src/data/repositories/ListResult";
import type { NewProjectInput, ProjectRepository } from "../../../src/data/repositories/ProjectRepository";
import { projectNotePath, validateEntityName } from "../../../src/data/VaultLayout";
import type { Project } from "../../../src/domain/models/project";
import { fail, ok, type Result } from "../../../src/domain/result";

export class InMemoryProjectRepository implements ProjectRepository {
    private readonly projects = new Map<string, Project>();

    // How many times update() wrote a project.
    updateCount = 0;

    // Puts a project in the store directly, bypassing create().
    seed(project: Project): void {
        this.projects.set(project.path, project);
    }

    get(path: string): Project | undefined {
        return this.projects.get(path);
    }

    list(): ListResult<Project> {
        return { items: [...this.projects.values()], skipped: []};
    }

    async create(input: NewProjectInput): Promise<Result<Project>> {
        const nameError = validateEntityName(input.name);
        if (nameError !== undefined) {
            return fail(nameError);
        }
        const path = projectNotePath(input.client.path, input.name);
        if (this.projects.has(path)) {
            return fail(
                `A project named "${input.name}" already exists for client "${input.client.name}".`,
            );
        }

        const project: Project = {
            path,
            name: input.name.trim(),
            client: input.client,
            status: "active",
            priority: input.priority,
            startDate: input.startDate,
            currentFocus: input.currentFocus ?? false,
        };
        this.projects.set(path, project);
        return ok(project);
    }

    async update(project: Project): Promise<Result<Project>> {
        if (!this.projects.has(project.path)) {
            return fail(`Project note "${project.path}" does not exist.`);
        }
        this.projects.set(project.path, project);
        this.updateCount += 1;
        return ok(project);
    }
}