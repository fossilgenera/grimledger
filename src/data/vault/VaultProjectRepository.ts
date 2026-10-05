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
import { projectFromFrontmatter, projectToFrontmatter } from "../mapping/projectMapper";
import { parseWikilinkTarget } from "../mapping/wikilink";
import type { ListResult, SkippedNote } from "../repositories/ListResult";
import type { NewProjectInput, ProjectRepository } from "../repositories/ProjectRepository";
import { ensureFolder } from "./ensureFolder";

const WIKILINK_HELP = 'Obsidian is not generating wikilinks. Turn on settings > Files and links > "Use [[Wikilinks]]", then try again.';

export class VaultProjectRepository implements ProjectRepository {
    constructor(private readonly app: App) {}

    list(): ListResult<Project> {
        const items: Project[] = [];
        const skipped: SkippedNote[] = [];

        for (const file of this.app.vault.getMarkdownFiles()) {
            const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
            if (frontmatter?.["type"] !== "project") {
                continue;
            }

            const mapped = projectFromFrontmatter(file.path, frontmatter);
            if (!mapped.ok) {
                skipped.push({ path: file.path, reason: mapped.reason });
                continue;
            }

            const { clientLinkPath, ...rest } = mapped.value;
            const clientFile = this.app.metadataCache.getFirstLinkpathDest(clientLinkPath, file.path);
            if (clientFile === null) {
                skipped.push({ path: file.path, reason: `Client link target "${clientLinkPath}" does not resolve to a note.` });
                continue;
            }

            const clientFrontmatter = this.app.metadataCache.getFileCache(clientFile)?.frontmatter;
            if (clientFrontmatter?.["type"] !== "client") {
                skipped.push({
                    path: file.path,
                    reason: `Client link points to "${clientFile.path}, which is not a client note."`
                });
                continue;
            }

            items.push({
                ...rest,
                client: { path: clientFile.path, name: noteNameOf(clientFile.path) },
            });
        }

        return { items, skipped };
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
}