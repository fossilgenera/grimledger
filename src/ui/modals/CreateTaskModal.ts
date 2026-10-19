import { App, Modal, Notice, Setting } from "obsidian";
import { Project } from "../../domain/models/project";
import { PRIORITIES, Priority } from "../../domain/types";
import { TaskService } from "../../services/TaskService";
import { isOneOf, readOptionalIsoDate } from "../../data/mapping/fields";
import { parseOptionalDuration } from "../../domain/rules/duration";
import { capitalise } from "./capitalise";

export class CreateTaskModal extends Modal {
    private selectedProject: Project;
    private name = "";
    private priority: Priority = "medium";
    private due = "";
    private estimate = "";
    private errorEl: HTMLElement | undefined;
    private submitting = false;

    constructor(
        app: App,
        private readonly tasks: TaskService,
        private readonly projects: readonly Project[],
    ) {
        super(app);
        const first = projects[0];
        if (first === undefined) {
            throw new Error("CreateTaskModal requires at least one project");
        }
        this.selectedProject = first;
    }

    override onOpen(): void {
        this.setTitle("Create task");

        new Setting(this.contentEl).setName("Project").addDropdown((dropdown) => {
            for (const project of this.projects) {
                dropdown.addOption(project.path, `${project.client.name} / ${project.name}`);
            }
            dropdown.setValue(this.selectedProject.path).onChange((value) => {
                const found = this.projects.find((project) => project.path === value);
                if (found) {
                    this.selectedProject = found;
                }
            });
        });

        new Setting(this.contentEl).setName("Name").addText((text) => {
            text.setPlaceholder("Fix transaction mapping").onChange((value) => {
                this.name = value;
            });
            this.submitOnEnter(text.inputEl);
            text.inputEl.focus();
        });

        new Setting(this.contentEl).setName("Priority").addDropdown((dropdown) => {
            for (const priority of PRIORITIES) {
                dropdown.addOption(priority, capitalise(priority));
            }
            dropdown.setValue(this.priority).onChange((value) => {
                if (isOneOf(PRIORITIES, value)) {
                    this.priority = value;
                }
            });
        });

        new Setting(this.contentEl)
            .setName("Due date")
            .setDesc("Optional. Format YYYY-MM-DD.")
            .addText((text) => {
                text.setPlaceholder("2026-10-12").onChange((value) => {
                    this.due = value;
                });
            this.submitOnEnter(text.inputEl);
            });
        new Setting(this.contentEl)
            .setName("Estimate")
            .setDesc("Optional. For example 90, 45m, 2h or 1h 30m.")
            .addText((text) => {
                text.setPlaceholder("1h 30m").onChange((value) => {
                    this.estimate = value;
                });
                this.submitOnEnter(text.inputEl);
            });
        
        this.errorEl = this.contentEl.createDiv();
        this.errorEl.classList.add("grimledger-error");

        new Setting(this.contentEl).addButton((button) => 
            button
                .setButtonText("Create")
                .setCta()
                .onClick(() => {
                    void this.submit();
                }),
        );
    }

    override onClose(): void {
        this.contentEl.empty();
    }

    private submitOnEnter(input: HTMLInputElement): void {
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                void this.submit();
            }
        })
    }

    private showError(message: string): void {
        if (this.errorEl === undefined) {
            throw new Error("CreateTaskModal: the error element was never created");
        }
        this.errorEl.textContent = message;
    }

    private async submit(): Promise<void> {
        if (this.submitting) {
            return;
        }

        const due = readOptionalIsoDate(this.due.trim());
        if (!due.ok) {
            this.showError(`Due date: ${due.reason}`);
            return;
        }
        const estimate = parseOptionalDuration(this.estimate);
        if (!estimate.ok) {
            this.showError(`Estimate: ${estimate.reason}`);
            return;
        }

        this.submitting = true;
        try {
            const result = await this.tasks.createTask({
                project: { path: this.selectedProject.path, name: this.selectedProject.name },
                name: this.name,
                priority: this.priority,
                due: due.value,
                estimatedMinutes: estimate.value,
            });
            if (!result.ok) {
                this.showError(result.reason);
                return;
            }
            this.close();
            new Notice(`Created task "${result.value.name}"`);
        } catch (error) {
            console.error("Grimledger: failed to create task", error);
            this.showError("Unexpected error. See the developer console (Ctrl+Shift+I).");
        } finally {
            this.submitting = false;
        }
    }
}