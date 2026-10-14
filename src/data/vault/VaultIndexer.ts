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
        const notes = readNoteSnapshots(this.app);
        this.store.replace(buildIndex(notes, makeLinkResolver(this.app)));
    }
}