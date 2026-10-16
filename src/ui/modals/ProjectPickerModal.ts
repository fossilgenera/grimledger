import { App, FuzzySuggestModal } from "obsidian";
import type { FocusCandidate } from "../../queries/focusCandidates";

/** Fuzzy search over projects. Contains no rules. */
export class ProjectPickerModal extends FuzzySuggestModal<FocusCandidate> {
    constructor(
        app: App,
        private readonly choices: readonly FocusCandidate[],
        private readonly onPick: (chosen: FocusCandidate) => void,
    ) {
        super(app);
    }

    override getItems(): FocusCandidate[] {
        return [...this.choices];
    }

    override getItemText(item: FocusCandidate): string {
        return item.label;
    }

    override onChooseItem(item: FocusCandidate): void {
        this.onPick(item);
    }
}