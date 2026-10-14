import { ItemView, type WorkspaceLeaf } from "obsidian";
import { createRoot, type Root } from "react-dom/client";
import type { IndexStore } from "../../data/index/IndexStore";
import type { IsoDate } from "../../domain/types";
import { DashboardApp } from "./DashboardApp";

export const DASHBOARD_VIEW_TYPE = "grimledger-dashboard";

/**
 * The Obsidian side of the dashboard: a tab that hosts a React tree.
 * Holds the store, never another view. Obsidian may create views repeatedly.
 */
export class DashboardView extends ItemView {
  private root: Root | undefined;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly store: IndexStore,
    private readonly today: () => IsoDate,
  ) {
    super(leaf);
  }

  override getViewType(): string {
    return DASHBOARD_VIEW_TYPE;
  }

  override getDisplayText(): string {
    return "Grimledger dashboard";
  }

  override async onOpen(): Promise<void> {
    this.root = createRoot(this.contentEl);
    this.root.render(<DashboardApp store={this.store} today={this.today} />);
  }

  override async onClose(): Promise<void> {
    // Unmounting also removes the store subscription and the date timer.
    this.root?.unmount();
    this.root = undefined;
  }
}