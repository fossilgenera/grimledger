import { App, Modal, Notice, Setting } from "obsidian";
import { CompletionService } from "../../services/CompletionService";
import { LabelledTask } from "../../queries/labelTasks";
import {
  formatDuration,
  parseOptionalDuration,
} from "../../domain/rules/duration";

export class CompleteTaskModal extends Modal {
  private outcome = "";
  private time = "";
  private errorEl: HTMLElement | undefined;
  private submitting = false;

  constructor(
    app: App,
    private readonly completion: CompletionService,
    private readonly chosen: LabelledTask,
  ) {
    super(app);
  }

  override onOpen(): void {
    this.setTitle("Complete task");
    this.contentEl.createEl("div", { text: this.chosen.label });

    new Setting(this.contentEl)
      .setName("Time spent")
      .setDesc(
        "Optional. For example 90, 45m, 2h or 1h 30m. Logged as a session dated today.",
      )
      .addText((text) => {
        text.setPlaceholder("1h 30m").onChange((value) => {
          this.time = value;
        });
        this.submitOnEnter(text.inputEl);
        text.inputEl.focus();
      });

    new Setting(this.contentEl)
      .setName("Outcome")
      .setDesc("Optional. What was the result?")
      .addText((text) => {
        text
          .setPlaceholder("Fixed incorrect transaction mapping")
          .onChange((value) => {
            this.outcome = value;
          });
        this.submitOnEnter(text.inputEl);
      });

    this.errorEl = this.contentEl.createDiv();
    this.errorEl.classList.add("grimledger-error");

    new Setting(this.contentEl).addButton((button) =>
      button
        .setButtonText("Complete")
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
    });
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

    const minutes = parseOptionalDuration(this.time);
    if (!minutes.ok) {
      this.showError(`Time spent: ${minutes.reason}`);
      return;
    }

    this.submitting = true;
    try {
      const result = await this.completion.complete({
        taskPath: this.chosen.task.path,
        outcome: this.outcome,
        minutes: minutes.value,
      });
      if (!result.ok) {
        this.showError(result.reason);
        return;
      }
      this.close();
      const logged =
        minutes.value === undefined
          ? ""
          : ` and logged ${formatDuration(minutes.value)}`;
      new Notice(`Completed "${result.value.name}"${logged}`);
    } catch (error) {
      console.error("Grimledger: failed to complete task", error);
      this.showError(
        "Unexpected error. See the developer console (Ctrl+Shift+I).",
      );
    } finally {
      this.submitting = false;
    }
  }
}
