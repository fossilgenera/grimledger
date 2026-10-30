import { Notice, type Plugin, type App } from "obsidian";
import type { DailyNoteService } from "../services/DailyNoteService";
import { openNoteInTab } from "./openNote";

async function openTodaysNote(
  app: App,
  service: DailyNoteService,
): Promise<void> {
  const result = await service.ensureToday();
  if (!result.ok) {
    new Notice(result.reason);
    return;
  }
  await openNoteInTab(app, result.value.path);
}

/**
 * Registers the "Open today's note" command and returns the same action, so the dashboard button can
 * call it too.
 */
export function registerDailyNotes(
  plugin: Plugin,
  service: DailyNoteService,
): () => void {
  const open = (): void => {
    openTodaysNote(plugin.app, service).catch((error: unknown) => {
      console.error("Grimledger: could not open today's note", error);
      new Notice("Could not open today's note. See the developer console.");
    });
  };

  plugin.addCommand({
    id: "open-todays-note",
    name: "Open today's note",
    callback: open,
  });

  return open;
}
