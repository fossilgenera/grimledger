import { debounce, Plugin } from "obsidian";

/** Quiet period before a rebuild runs, in milliseconds. */
const REBUILD_DELAY_MS = 250;

/** 
 * Calls `rebuild` after anything happens that can change the index.
 * Events are registered inside onLayoutReady so the flood of events during
 * startup is skipped, then one rebuild runs immediately.
 */
export function registerIndexEvents(plugin: Plugin, rebuild: () => void): void {
    // true: the timer restarts on every call, so this runs after a quiet period.
    const scheduleRebuild = debounce(rebuild, REBUILD_DELAY_MS, true);
    plugin.register(() => scheduleRebuild.cancel());

    plugin.app.workspace.onLayoutReady(() => {
        const { metadataCache, vault } = plugin.app;

        // A file was indexed (edited, created, or its properties changed).
        plugin.registerEvent(metadataCache.on("changed", () => scheduleRebuild()));
        // A file was deleted.
        plugin.registerEvent(metadataCache.on("deleted", () => scheduleRebuild()));
        // All links finished resolving (also covers startup).
        plugin.registerEvent(metadataCache.on("resolved", () => scheduleRebuild()));
        // "changed" is not called on rename, so listen to the vault as well.
        plugin.registerEvent(vault.on("rename", () => scheduleRebuild()));

        rebuild();
    })
}