import { Modal, Notice, Setting, type App } from "obsidian";
import { isOneOf, readOptionalIsoDate } from "../../data/mapping/fields";
import type { ProjectRepository } from "../../data/repositories/ProjectRepository";
import type { Client } from "../../domain/models/client";
import { PRIORITIES, type Priority } from "../../domain/types";
import { capitalise } from "./capitalise";

export class CreateProjectModal extends Modal {
  private selectedClient: Client;
  private name = "";
  private priority: Priority = "medium";
  private startDate = "";
  private currentFocus = false;
  private errorEl: HTMLElement | undefined;
  private submitting = false;

  constructor(
    app: App,
    private readonly projects: ProjectRepository,
    private readonly clients: readonly Client[],
  ) {
    super(app);
    const first = clients[0];
    if (first === undefined) {
      throw new Error("CreateProjectModal requires at least one client");
    }
    this.selectedClient = first;
  }

  override onOpen(): void {
    this.setTitle("Create project");

    new Setting(this.contentEl).setName("Client").addDropdown((dropdown) => {
      for (const client of this.clients) {
        dropdown.addOption(client.path, client.name);
      }
      dropdown.setValue(this.selectedClient.path).onChange((value) => {
        const found = this.clients.find((client) => client.path === value);
        if (found) {
          this.selectedClient = found;
        }
      });
    });

    new Setting(this.contentEl).setName("Name").addText((text) => {
      text.setPlaceholder("MRI Reporting").onChange((value) => {
        this.name = value;
      });
      text.inputEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          void this.submit();
        }
      });
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
      .setName("Start date")
      .setDesc("Optional. Format YYYY-MM-DD.")
      .addText((text) => {
        text.setPlaceholder("2026-10-05").onChange((value) => {
          this.startDate = value;
        });
      });

    new Setting(this.contentEl).setName("Current focus").addToggle((toggle) => {
      toggle.setValue(this.currentFocus).onChange((value) => {
        this.currentFocus = value;
      });
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
      throw new Error("CreateProjectModal: the error element was never created");
    }
    this.errorEl.textContent = message;
  }

  private async submit(): Promise<void> {
    if (this.submitting) {
      return;
    }

    // Same rule as the mapper uses, so the form and the reader cannot disagree.
    const date = readOptionalIsoDate(this.startDate.trim());
    if (!date.ok) {
      this.showError(`Start date: ${date.reason}`);
      return;
    }

    this.submitting = true;
    try {
      const result = await this.projects.create({
        client: { path: this.selectedClient.path, name: this.selectedClient.name },
        name: this.name,
        priority: this.priority,
        startDate: date.value,
        currentFocus: this.currentFocus,
      });
      if (!result.ok) {
        this.showError(result.reason);
        return;
      }
      this.close();
      new Notice(`Created project "${result.value.name}"`);
      await this.app.workspace.openLinkText(result.value.path, "");
    } catch (error) {
      console.error("Grimledger: failed to create project", error);
      this.showError("Unexpected error. See the developer console (Ctrl+Shift+I).");
    } finally {
      this.submitting = false;
    }
  }
}