import type { App } from "obsidian";
import type { ClientRepository } from "../repositories/ClientRepository";
import { copyListResult, type ListResult } from "../repositories/ListResult";
import type { Client } from "../../domain/models/client";
import { clientToFrontMatter } from "../mapping/clientMapper";
import { fail, ok, type Result } from "../../domain/result";
import { clientFolderPath, clientNotePath, noteNameOf, validateEntityName } from "../VaultLayout";
import type { IndexStore } from "../index/IndexStore";
import { ensureFolder } from "./ensureFolder";

export class VaultClientRepository implements ClientRepository {
    constructor(
        private readonly app: App,
        private readonly store: IndexStore,
    ) {}

    list(): ListResult<Client> {
        return copyListResult(this.store.snapshot.clients);
    }

    async create(name: string): Promise<Result<Client>> {
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