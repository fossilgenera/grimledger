import { App } from "obsidian";
import { LinkResolver, NoteSnapshot } from "../index/buildIndex";

/** One snapshot per markdown note, read from Obsidian's metadata cache. */
export function readNoteSnapshots(app: App): NoteSnapshot[] {
    return app.vault.getMarkdownFiles().map((file) => ({
        path: file.path,
        frontmatter: app.metadataCache.getFileCache(file)?.frontmatter,
    }));
}

/**
 * Wraps Obsidian's link resolver as a plain function.
 * Returns the target note's path, so no TFile leaves this file.
 */
export function makeLinkResolver(app: App): LinkResolver {
    return (linkPath, sourcePath) => 
        app.metadataCache.getFirstLinkpathDest(linkPath, sourcePath)?.path;
}