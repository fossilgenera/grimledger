import { App } from "obsidian";
import { IndexStore } from "../index/IndexStore";
import { makeLinkResolver, readNoteSnapshots } from "./readNotes";
import { buildIndex } from "../index/buildIndex";

/** Reads the vault, builds the index, and puts the result in the store. */
export class VaultIndexer {
    constructor(
        private readonly app: App,
        private readonly store: IndexStore,
    ) {}

    rebuild(): void {
        const started = performance.now();

        const notes = readNoteSnapshots(this.app);
        const snapshot = buildIndex(notes, makeLinkResolver(this.app));
        this.store.replace(snapshot);

        // Temporary: remove after Milestone 4c
        const ms = (performance.now() - started).toFixed(1);
        const { clients, projects, tasks } = snapshot;
        console.log(
        `Grimledger: index rebuilt in ${ms} ms from ${notes.length} notes. ` +
            `clients ${clients.items.length}/${clients.skipped.length} skipped, ` +
            `projects ${projects.items.length}/${projects.skipped.length} skipped, ` +
            `tasks ${tasks.items.length}/${tasks.skipped.length} skipped`,
        );
    }
}