import { Modal, Notice, Setting, type App } from "obsidian";
import type { ClientRepository } from "../../data/repositories/ClientRepository";

export class CreateClientModal extends Modal {
  private name = "";
  private errorEl: HTMLElement | undefined;
  private submitting = false;

  constructor(
    app: App,
    private readonly clients: ClientRepository,
  ) {
    super(app);
  }

  override onOpen(): void {
    this.setTitle("Create client");

    new Setting(this.contentEl).setName("Name").addText((text) => {
      text.setPlaceholder("ABC Bank").onChange((value) => {
        this.name = value;
      });
      text.inputEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          void this.submit();
        }
      });
      text.inputEl.focus();
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

  private showError(message: string): void {
    if (this.errorEl === undefined) {
      throw new Error("CreateClientModal: The error element was never created");
    }
    this.errorEl.textContent = message;
  }

  private async submit(): Promise<void> {
    if (this.submitting) {
      return;
    }
    this.submitting = true;
    try {
      const result = await this.clients.create(this.name);
      if (!result.ok) {
        this.showError(result.reason);
        return;
      }
      this.close();
      new Notice(`Created client "${result.value.name}"`);
      await this.app.workspace.openLinkText(result.value.path, "", "tab");
    } catch (error) {
      console.error("Grimledger: failed to create client", error);
      this.showError("Unexpected error. See the developer console (Ctrl+Shift+I).");
    } finally {
      this.submitting = false;
    }
  }
}