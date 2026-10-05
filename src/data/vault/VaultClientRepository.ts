import { App } from "obsidian";
import { ClientRepository } from "../repositories/ClientRepository";
import { ListResult, SkippedNote } from "../repositories/ListResult";
import { Client } from "../../domain/models/client";
import { clientFromFrontMatter, clientToFrontMatter } from "../mapping/clientMapper";
import { fail, MapResult, ok } from "../mapping/mapResult";
import { clientFolderPath, clientNotePath, noteNameOf, validateEntityName } from "../VaultLayout";
import { ensureFolder } from "./ensureFolder";

export class VaultClientRepository implements ClientRepository {
    constructor(private readonly app: App) {}

    list(): ListResult<Client> {
        const items: Client[] = [];
        const skipped: SkippedNote[] = [];

        for (const file of this.app.vault.getMarkdownFiles()) {
            const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
            if (frontmatter?.["type"] !== "client") {
                continue;
            }
            const result = clientFromFrontMatter(file.path, frontmatter);
            if (result.ok) {
                items.push(result.value);
            } else {
                skipped.push({ path: file.path, reason: result.reason });
            }
        }
        return { items, skipped };
    }

    async create(name: string): Promise<MapResult<Client>> {
        const nameError = validateEntityName(name);
        if (nameError !== undefined) {
            return fail(nameError);
        }

        const notePath = clientNotePath(name);
        if (this.app.vault.getAbstractFileByPath(notePath) !== null) {
            return fail(`A client named "${name}" already exists.`);
        }

        await ensureFolder(this.app.vault, clientFolderPath(name));
        const file = await this.app.vault.create(notePath, "");

        const status: Client["status"] = "active";
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            Object.assign(frontmatter, clientToFrontMatter({ status }));
        });
        return ok({ path: notePath, name: noteNameOf(notePath), status });
    }
}