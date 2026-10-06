import { App } from "obsidian";
import { NewTaskInput, TaskRepository } from "../repositories/TaskRepository";
import { ListResult, SkippedNote } from "../repositories/ListResult";
import { Task } from "../../domain/models/task";
import { taskFromFrontmatter, taskMutableToFrontmatter, taskToFrontmatter } from "../mapping/taskMapper";
import { folderOf, noteNameOf, taskFolderPath, taskNotePath, validateEntityName } from "../VaultLayout";
import { fail, ok, Result } from "../../domain/result";
import { parseWikilinkTarget } from "../mapping/wikilink";
import { ensureFolder } from "./ensureFolder";

const WIKILINK_HELP = 
    `Obsidian is not generating wikilinks. Turn on settings > Files and links > "Use [[Wikilinks]]", then try again.`;

export class VaultTaskRepository implements TaskRepository {
    constructor(private readonly app: App) {}

    list(): ListResult<Task> {
        const items: Task[] = [];
        const skipped: SkippedNote[] = [];

        for (const file of this.app.vault.getMarkdownFiles()) {
            const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
            if (frontmatter?.["type"] !== "task") {
                continue;
            }

            const mapped = taskFromFrontmatter(file.path, frontmatter);
            if (!mapped.ok) {
                skipped.push({ path: file.path, reason: mapped.reason });
                continue;
            }

            const { projectLinkPath, ...rest } = mapped.value;
            const projectFile = this.app.metadataCache.getFirstLinkpathDest(
                projectLinkPath,
                file.path,
            );
            if (projectFile === null) {
                skipped.push({
                    path: file.path,
                    reason: `Project link target "${projectLinkPath}" does not resolve to a note.`,
                });
                continue;
            }

            const projectFrontmatter = 
                this.app.metadataCache.getFileCache(projectFile)?.frontmatter;
            if (projectFrontmatter?.["type"] !== "project") {
                skipped.push({
                    path: file.path,
                    reason: `Project link points to "${projectFile.path}" which is not a project note.`,
                });
                continue;
            }

            items.push({
                ...rest,
                project: { path: projectFile.path, name: noteNameOf(projectFile.path) },
            });
        }

        return { items, skipped };
    }

    async create(input: NewTaskInput): Promise<Result<Task>> {
        const nameError = validateEntityName(input.name);
        if (nameError !== undefined) {
            return fail(nameError);
        }
        
        const projectFile = this.app.vault.getFileByPath(input.project.path);
        if (projectFile === null) {
            return fail(`Project note "${input.project.path}" does not exist.`);
        }

        if (folderOf(input.project.path) === "") {
            return fail(
                `Project note "${input.project.path}" is not inside a folder, so a task cannot be created beside it.`,
            );
        }

        const notePath = taskNotePath(input.project.path, input.name);
        if (this.app.vault.getAbstractFileByPath(notePath) !== null) {
            return fail(
                `A task named "${input.name}" already exists in project "${input.project.name}"`
            );
        }

        // Verify that Obsidian's generator produced a wikilink.
        const projectLink = this.app.fileManager.generateMarkdownLink(
            projectFile,
            notePath,
        );
        if (parseWikilinkTarget(projectLink) === undefined) {
            return fail(WIKILINK_HELP);
        }

        await ensureFolder(this.app.vault, taskFolderPath(input.project.path));
        const file = await this.app.vault.create(notePath, "");
        
        const status: Task["status"] = "not-started";

        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            Object.assign(
                frontmatter,
                taskToFrontmatter({
                    projectLink,
                    status,
                    priority: input.priority,
                    due: input.due,
                    estimatedMinutes: input.estimatedMinutes,
                    created: input.created,
                    completed: undefined,
                    outcome: undefined,
                }),
            );
        });

        return ok({
            path: notePath,
            name: noteNameOf(notePath),
            project: input.project,
            status,
            priority: input.priority,
            due: input.due,
            estimatedMinutes: input.estimatedMinutes,
            created: input.created,
            completed: undefined,
            outcome: undefined,
        });
    }

    async update(task: Task): Promise<Result<Task>> {
        const file = this.app.vault.getFileByPath(task.path);
        if (file === null) {
            return fail(`Task note "${task.path}" does not exist.`);
        }

        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            Object.assign(frontmatter, taskMutableToFrontmatter(task));
        })

        return ok(task);
    }
}