import { Notice, type App, type Plugin } from "obsidian";
import type { IndexStore } from "../data/index/IndexStore";
import type { IsoDate } from "../domain/types";
import { DASHBOARD_VIEW_TYPE, DashboardView } from "../ui/views/DashboardView";

/** Shows the existing dashboard tab, or opens a new one. */
async function openDashboard(app: App): Promise<void> {
  const { workspace } = app;

  const existing = workspace.getLeavesOfType(DASHBOARD_VIEW_TYPE)[0];
  if (existing !== undefined) {
    await workspace.revealLeaf(existing);
    return;
  }

  const leaf = workspace.getLeaf("tab");
  await leaf.setViewState({ type: DASHBOARD_VIEW_TYPE, active: true });
  await workspace.revealLeaf(leaf);
}

export function registerDashboard(
  plugin: Plugin,
  store: IndexStore,
  today: () => IsoDate,
): void {
  plugin.registerView(
    DASHBOARD_VIEW_TYPE,
    (leaf) => new DashboardView(leaf, store, today),
  );

  plugin.addCommand({
    id: "open-dashboard",
    name: "Open dashboard",
    callback: () => {
      openDashboard(plugin.app).catch((error: unknown) => {
        console.error("Grimledger: could not open the dashboard", error);
        new Notice("Could not open the dashboard. See the developer console.");
      });
    },
  });
}