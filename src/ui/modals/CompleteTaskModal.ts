import { App, Modal, Notice, Setting } from "obsidian";
import { TaskService } from "../../services/TaskService";
import { LabelledTask } from "../../queries/labelTasks";

export class CompleteTaskModal extends Modal {
    private outcome = "";
    private errorEl: HTMLElement | undefined;
    private submitting = false;

    constructor(
        app: App,
        private readonly tasks: TaskService,
        private readonly chosen: LabelledTask,
    ) {
        super(app);
    }

    override onOpen(): void {
        this.setTitle("Complete task");
        this.contentEl.createEl("div", { text: this.chosen.label });

        new Setting(this.contentEl)
            .setName("Outcome")
            .setDesc("Optional. What was the result?")
            .addText((text) => {
                text.setPlaceholder("Fixed incorrect transaction mapping").onChange((value) => {
                    this.outcome = value;
                });
                text.inputEl.addEventListener("keydown", (event) => {
                    if (event.key === "Enter") {
                        void this.submit();
                    }
                });
                text.inputEl.focus();
            });

        this.errorEl = this.contentEl.createDiv();
        this.errorEl.style.color = "var(--text-error)";

        new Setting(this.contentEl).addButton((button) =>
            button
                .setButtonText("Complete")
                .setCta()
                .onClick(() => {
                    void this.submit();
                }))
    }

    override onClose(): void {
        this.contentEl.empty();
    }

    private showError(message: string): void {
        if (this.errorEl === undefined) {
            throw new Error("CompleteTaskModal: the error element was never created");
        }
        this.errorEl.textContent = message;
    }

    private async submit(): Promise<void> {
        if (this.submitting) {
            return;
        }

        this.submitting = true;
        try {
            const result = await this.tasks.completeTask(this.chosen.task.path, this.outcome);
            if (!result.ok) {
                this.showError(result.reason);
                return;
            }
            this.close();
            new Notice(`Completed "${result.value.name}"`);
        } catch (error) {
            console.error("Grimledger: failed to complete task", error);
            this.showError("Unexpected error. See the developer console (Ctrl+Shift+I).");
        } finally {
            this.submitting = false;
        }
    }
}