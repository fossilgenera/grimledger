import type { App } from "obsidian";
import type { NewWorkSessionInput, WorkSessionRepository } from "../repositories/WorkSessionRepository";
import type { IndexStore } from "../index/IndexStore";
import { copyListResult, type ListResult } from "../repositories/ListResult";
import type { WorkSession } from "../../domain/models/workSession";
import { fail, ok, type Result } from "../../domain/result";
import { readRequiredIsoDate } from "../mapping/fields";
import { folderOf, noteNameOf, sessionFolderPath, sessionNotePath } from "../VaultLayout";
import { nextSessionName } from "../../domain/rules/sessionName";
import { parseWikilinkTarget } from "../mapping/wikilink";
import { ensureFolder } from "./ensureFolder";
import { workSessionFromFrontmatter, workSessionToFrontmatter } from "../mapping/workSessionMapper";

const WIKILINK_HELP = 
    `Obsidian is not generating wikilinks. Turn on settings > Files and links > "Use [[Wikilinks]]", then try again.`;

export class VaultWorkSessionRepository implements WorkSessionRepository {
    constructor(
        private readonly app: App,
        private readonly store: IndexStore,
    ) {}

    list(): ListResult<WorkSession> {
        return copyListResult(this.store.snapshot.workSessions);
    }

    async create(input: NewWorkSessionInput): Promise<Result<WorkSession>> {
        // Checks first. Nothing is written until all of them pass.
        if (!Number.isInteger(input.minutes) || input.minutes <= 0) {
            return fail("Minutes must be a positive whole number.");
        }
        const date = readRequiredIsoDate(input.date, "date");
        if (!date.ok) {
            return fail(date.reason);
        }

        const projectPath = input.task.project.path;
        if (this.app.vault.getFileByPath(projectPath) === null) {
            return fail(`Project note "${projectPath}" does not exist.`);
        }
        if (folderOf(projectPath) === "") {
            return fail(
                `Project note "${projectPath}" is not inside a folder, so a session cannot be created beside it.`
            );
        }
        const taskFile = this.app.vault.getFileByPath(input.task.path);
        if (taskFile === null) {
            return fail(`Task note "${input.task.path}" does not exist.`)
        }

        // Names come from the real vault, not the index, which lags behind writes.
        const folder = sessionFolderPath(projectPath);
        const existingNames = this.app.vault
                .getMarkdownFiles()
                .filter((file) => folderOf(file.path) === folder)
                .map((file) => noteNameOf(file.path));
        const name = nextSessionName(input.date, input.task.name, existingNames);
        const notePath = sessionNotePath(projectPath, name);

        const taskLink = this.app.fileManager.generateMarkdownLink(taskFile, notePath);
        if (parseWikilinkTarget(taskLink) === undefined) {
            return fail(WIKILINK_HELP);
        }

        await ensureFolder(this.app.vault, folder);
        const file = await this.app.vault.create(notePath, "");

        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            Object.assign(
                frontmatter,
                workSessionToFrontmatter({
                    taskLink,
                    date: input.date,
                    minutes: input.minutes,
                    note: input.note,
                }),
            );
        });

        return ok({
            path: notePath,
            name,
            task: { path: input.task.path, name: input.task.name },
            date: input.date,
            minutes: input.minutes,
            note: input.note,
        });
    }
}