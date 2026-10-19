import { App, Modal, Notice, Setting } from "obsidian";
import { TASK_STATUSES, TaskStatus } from "../../domain/types";
import { TaskService } from "../../services/TaskService";
import { LabelledTask } from "../../queries/labelTasks";
import { statusLabel } from "./statusLabel";
import { isOneOf } from "../../data/mapping/fields";

export class ChangeStatusModal extends Modal {
    private target: TaskStatus;
    private errorEl: HTMLElement | undefined;
    private submitting = false;

    constructor(
        app: App,
        private readonly tasks: TaskService,
        private readonly chosen: LabelledTask,
        private readonly targets: readonly TaskStatus[],
    ) {
        super(app);
        const first = targets[0];
        if (first === undefined) {
            throw new Error("ChangeStatusModal requires at least one target status");
        }
        this.target = first;
    }

    override onOpen(): void {
        this.setTitle("Change task status");
        this.contentEl.createEl("div", { text: this.chosen.label });

        new Setting(this.contentEl).setName("New status").addDropdown((dropdown) => {
            for (const status of this.targets) {
                dropdown.addOption(status, statusLabel(status));
            }
            dropdown.setValue(this.target).onChange((value) => {
                if (isOneOf(TASK_STATUSES, value)) {
                    this.target = value;
                }
            });
        });

        this.errorEl = this.contentEl.createDiv();
        this.errorEl.classList.add("grimledger-error");

        new Setting(this.contentEl).addButton((button) =>
            button
                .setButtonText("Change")
                .setCta()
                .onClick(() => {
                    void this.submit();
                }),
        );
    }

    override onClose(): void {
        this.contentEl.empty();
    }

    /** Prevents form bug from failing silently. */
    private showError(message: string): void {
        if (this.errorEl === undefined) {
            throw new Error("ChangeStatusModal: the error element was never created");
        }
        this.errorEl.textContent = message;
    }

    private async submit(): Promise<void> {
        if (this.submitting) {
            return;
        }

        this.submitting = true;
        try {
            // Pass the path not the task object
            const result = await this.tasks.changeTaskStatus(
                this.chosen.task.path,
                this.target,
            );
            if (!result.ok) {
                this.showError(result.reason);
                return;
            }
            this.close();
            new Notice(`"${result.value.name}" is now ${statusLabel(result.value.status).toLowerCase()}`);
        } catch (error) {
            console.error("Grimledger: failed to change task status", error);
            this.showError("Unexpected error. See the developer console (Ctrl+Shift+I).");
        } finally {
            this.submitting = false;
        }
    }
}