import { App, Modal, Notice, Setting } from "obsidian";
import type { SessionService } from "../../services/SessionService";
import type { LabelledTask } from "../../queries/labelTasks";
import type { IsoDate } from "../../domain/types";
import { formatDuration, parseDuration } from "../../domain/rules/duration";
import { readRequiredIsoDate } from "../../data/mapping/fields";

export class LogTimeModal extends Modal {
  private time = "";
  private date: string;
  private note = "";
  private errorEl: HTMLElement | undefined;
  private submitting = false;

  constructor(
    app: App,
    private readonly sessions: SessionService,
    private readonly chosen: LabelledTask,
    today: IsoDate,
  ) {
    super(app);
    this.date = today;
  }

  override onOpen(): void {
    this.setTitle("Log time");
    this.contentEl.createEl("div", { text: this.chosen.label });

    new Setting(this.contentEl)
      .setName("Time spent")
      .setDesc("For example 90, 45m, 2h or 1h 30m.")
      .addText((text) => {
        text.setPlaceholder("1h 30m").onChange((value) => {
          this.time = value;
        });
        this.submitOnEnter(text.inputEl);
        text.inputEl.focus();
      });

    new Setting(this.contentEl)
      .setName("Date")
      .setDesc("Format YYYY-MM-DD. Defaults to today.")
      .addText((text) => {
        text.setValue(this.date).onChange((value) => {
          this.date = value;
        });
        this.submitOnEnter(text.inputEl);
      });

    new Setting(this.contentEl)
      .setName("Note")
      .setDesc("Optional. What did you do?")
      .addText((text) => {
        text.onChange((value) => {
          this.note = value;
        });
        this.submitOnEnter(text.inputEl);
      });

    this.errorEl = this.contentEl.createDiv();
    this.errorEl.classList.add("grimledger-error");

    new Setting(this.contentEl).addButton((button) =>
      button
        .setButtonText("Log time")
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
      throw new Error("LogTimeModal: the error element was never created");
    }
    this.errorEl.textContent = message;
  }

  private async submit(): Promise<void> {
    if (this.submitting) {
      return;
    }

    const minutes = parseDuration(this.time);
    if (!minutes.ok) {
      this.showError(`Time spent: ${minutes.reason}`);
      return;
    }
    const date = readRequiredIsoDate(this.date.trim(), "Date");
    if (!date.ok) {
      this.showError(date.reason);
      return;
    }
    const note = this.note.trim();

    this.submitting = true;
    try {
      const result = await this.sessions.logTime({
        taskPath: this.chosen.task.path,
        date: date.value,
        minutes: minutes.value,
        note: note === "" ? undefined : note,
      });
      if (!result.ok) {
        this.showError(result.reason);
        return;
      }
      this.close();
      new Notice(
        `Logged ${formatDuration(result.value.minutes)} on "${result.value.task.name}"`,
      );
    } catch (error) {
      console.error("Grimledger: failed to log time", error);
      this.showError(
        "Unexpected error. See the developer console (Ctrl+Shift+I)",
      );
    } finally {
      this.submitting = false;
    }
  }
}
