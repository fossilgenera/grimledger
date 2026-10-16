import type { App } from "obsidian";
import type { Project } from "../../domain/models/project";
import {
  noteNameOf,
  projectFolderPath,
  projectNotePath,
  validateEntityName,
  folderOf,
} from "../VaultLayout";
import { fail, ok, type Result } from "../../domain/result";
import { projectMutableToFrontmatter, projectToFrontmatter } from "../mapping/projectMapper";
import { parseWikilinkTarget } from "../mapping/wikilink";
import { copyListResult, type ListResult } from "../repositories/ListResult";
import type { NewProjectInput, ProjectRepository } from "../repositories/ProjectRepository";
import type { IndexStore } from "../index/IndexStore";
import { ensureFolder } from "./ensureFolder";

const WIKILINK_HELP = 'Obsidian is not generating wikilinks. Turn on settings > Files and links > "Use [[Wikilinks]]", then try again.';

export class VaultProjectRepository implements ProjectRepository {
    constructor(
        private readonly app: App,
        private readonly store: IndexStore,
    ) {}

    list(): ListResult<Project> {
        return copyListResult(this.store.snapshot.projects);
    }

    async create(input: NewProjectInput): Promise<Result<Project>> {
        const nameError = validateEntityName(input.name);
        if (nameError !== undefined) {
            return fail(nameError);
        }

        const clientFile = this.app.vault.getFileByPath(input.client.path);
        if (clientFile === null) {
            return fail(`Client note "${input.client.path}" does not exist.`);
        }

        // Client note at vault root has no folder to put a Projects folder next to
        if (folderOf(input.client.path) === "") {
            return fail(
                `Client note "${input.client.path}" is not inside a folder, so a project cannot be created beside it.`
            );
        }

        const notePath = projectNotePath(input.client.path, input.name);
        if (this.app.vault.getAbstractFileByPath(notePath) !== null) {
            return fail(`A project named "${input.name}" already exists for client "${input.client.name}".`);
        }

        // Verify that Obsidian's generator produced a wikilink.
        const clientLink = this.app.fileManager.generateMarkdownLink(clientFile, notePath);
        if (parseWikilinkTarget(clientLink) === undefined) {
            return fail(WIKILINK_HELP);
        }

        await ensureFolder(this.app.vault, projectFolderPath(input.client.path, input.name));
        const file = await this.app.vault.create(notePath, "");

        const status: Project["status"] = "active";
        const startDate = input.startDate;
        const currentFocus = input.currentFocus ?? false;

        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            Object.assign(
                frontmatter,
                projectToFrontmatter({
                    clientLink,
                    status,
                    priority: input.priority,
                    startDate,
                    currentFocus,
                }),
            );
        });

        return ok({
            path: notePath,
            name: noteNameOf(notePath),
            client: input.client,
            status,
            priority: input.priority,
            startDate,
            currentFocus
        });
    }

    async update(project: Project): Promise<Result<Project>> {
        const file = this.app.vault.getFileByPath(project.path);
        if (file === null) {
            return fail(`Project note "${project.path}" does not exist.`);
        }

        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            Object.assign(frontmatter, projectMutableToFrontmatter(project));
        })

        return ok(project);
    }
}