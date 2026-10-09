import { App, FuzzySuggestModal } from "obsidian";
import { LabelledTask } from "../../queries/labelTasks";

/** Fuzzy search over labelled tasks. Contains no rules. */
export class TaskPickerModal extends FuzzySuggestModal<LabelledTask> {
    constructor(
        app: App,
        private readonly choices: readonly LabelledTask[],
        private readonly onPick: (chosen: LabelledTask) => void,
    ) {
        super(app);
    }

    override getItems(): LabelledTask[] {
        return [...this.choices];
    }

    override getItemText(item: LabelledTask): string {
        return item.label;
    }

    override onChooseItem(item: LabelledTask): void {
        this.onPick(item);
    }
}