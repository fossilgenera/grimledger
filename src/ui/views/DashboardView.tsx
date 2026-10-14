import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, type Root } from "react-dom/client";
import { IndexStore } from "../../data/index/IndexStore";
import { DashboardApp } from "./DashboardApp";

export const DASHBOARD_VIEW_TYPE = "grimledger-dashboard";

/**
 * The Obsidian side of the dashboard.
 */
export class DashboardView extends ItemView {
    private root: Root | undefined;

    constructor(
        leaf: WorkspaceLeaf,
        private readonly store: IndexStore,
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
        this.root.render(<DashboardApp store={this.store} />);
    }

    override async onClose(): Promise<void> {
        // Unmounting also removes the store subscription.
        this.root?.unmount;
        this.root = undefined;
    }
}