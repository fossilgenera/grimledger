import { App, Modal, Notice, Setting } from "obsidian";
import type { TaskService } from "../../services/TaskService";
import type { LabelledTask } from "../../queries/labelTasks";
import type { IsoDate } from "../../domain/types";
import { readOptionalIsoDate } from "../../data/mapping/fields";

export class BlockTaskModal extends Modal {
  private waitingOn = "";
  private blockedBy = "";
  private since: string;
  private expected = "";
  private errorEl: HTMLElement | undefined;
  private submitting = false;

  constructor(
    app: App,
    private readonly tasks: TaskService,
    private readonly chosen: LabelledTask,
    today: IsoDate,
  ) {
    super(app);
    this.since = today;
  }

  override onOpen(): void {
    this.setTitle("Block task");
    this.contentEl.createEl("div", { text: this.chosen.label });

    new Setting(this.contentEl)
      .setName("Waiting on")
      .setDesc(
        "What is the task waiting for? For example: production credentials.",
      )
      .addText((text) => {
        text.onChange((value) => {
          this.waitingOn = value;
        });
        this.submitOnEnter(text.inputEl);
        text.inputEl.focus();
      });

    new Setting(this.contentEl)
      .setName("Blocked by")
      .setDesc("Optional. Who or what is blocking it? For example: Client.")
      .addText((text) => {
        text.onChange((value) => {
          this.blockedBy = value;
        });
        this.submitOnEnter(text.inputEl);
      });

    new Setting(this.contentEl)
      .setName("Blocked since")
      .setDesc("Format YYYY-MM-DD. Today by default. Cannot be in the future.")
      .addText((text) => {
        text.setValue(this.since).onChange((value) => {
          this.since = value;
        });
        this.submitOnEnter(text.inputEl);
      });

    new Setting(this.contentEl)
      .setName("Expected resolution")
      .setDesc("Optional. Format YYYY-MM-DD.")
      .addText((text) => {
        text.onChange((value) => {
          this.expected = value;
        });
        this.submitOnEnter(text.inputEl);
      });

    this.errorEl = this.contentEl.createDiv();
    this.errorEl.classList.add("grimledger-error");

    new Setting(this.contentEl).addButton((button) =>
      button
        .setButtonText("Block")
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
      throw new Error("BlockTaskModal: the error element was never created");
    }
    this.errorEl.textContent = message;
  }

  private async submit(): Promise<void> {
    if (this.submitting) {
      return;
    }

    const since = readOptionalIsoDate(this.since.trim());
    if (!since.ok) {
      this.showError(`Blocked since: ${since.reason}`);
      return;
    }
    if (since.value === undefined) {
      this.showError("Blocked since: enter a date.");
      return;
    }
    const expected = readOptionalIsoDate(this.expected.trim());
    if (!expected.ok) {
      this.showError(`Expected resolution: ${expected.reason}`);
      return;
    }

    this.submitting = true;
    try {
      const result = await this.tasks.blockTask(this.chosen.task.path, {
        waitingOn: this.waitingOn,
        blockedBy: this.blockedBy,
        since: since.value,
        expectedResolution: expected.value,
      });
      if (!result.ok) {
        this.showError(result.reason);
        return;
      }
      this.close();
      new Notice(`Blocked "${result.value.name}"`);
    } catch (error) {
      console.error("Grimledger: failed to block task", error);
      this.showError(
        "Unexpected error. See the developer console (Ctrl+Shift+I).",
      );
    } finally {
      this.submitting = false;
    }
  }
}
