import type { App } from "obsidian";
import type { NewTaskInput, TaskRepository } from "../repositories/TaskRepository";
import { copyListResult, type ListResult } from "../repositories/ListResult";
import type { Task } from "../../domain/models/task";
import { taskMutableToFrontmatter, taskToFrontmatter } from "../mapping/taskMapper";
import { folderOf, noteNameOf, taskFolderPath, taskNotePath, validateEntityName } from "../VaultLayout";
import { fail, ok, type Result } from "../../domain/result";
import { parseWikilinkTarget } from "../mapping/wikilink";
import type { IndexStore } from "../index/IndexStore";
import { ensureFolder } from "./ensureFolder";

const WIKILINK_HELP = 
    `Obsidian is not generating wikilinks. Turn on settings > Files and links > "Use [[Wikilinks]]", then try again.`;

export class VaultTaskRepository implements TaskRepository {
    constructor(
        private readonly app: App,
        private readonly store: IndexStore,
    ) {}

    list(): ListResult<Task> {
        return copyListResult(this.store.snapshot.tasks);
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