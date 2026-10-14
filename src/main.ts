import { Plugin } from "obsidian";
import { VaultClientRepository } from "./data/vault/VaultClientRepository";
import { VaultProjectRepository } from "./data/vault/VaultProjectRepository";
import { registerCommands } from "./obsidian/commands";
import { VaultTaskRepository } from "./data/vault/VaultTaskRepository";
import { TaskService } from "./services/TaskService";
import { formatIsoDate } from "./domain/rules/isoDate";
import { IndexStore } from "./data/index/IndexStore";
import { VaultIndexer } from "./data/vault/VaultIndexer";
import { registerIndexEvents } from "./obsidian/events";
import { registerDashboard } from "./obsidian/dashboard";

export default class GrimledgerPlugin extends Plugin {
  override async onload(): Promise<void> {
    const store = new IndexStore();
    const indexer = new VaultIndexer(this.app, store);

    const clients = new VaultClientRepository(this.app, store);
    const projects = new VaultProjectRepository(this.app, store);
    const tasks = new VaultTaskRepository(this.app, store);

    const taskService = new TaskService(tasks, () => formatIsoDate(new Date()));

    registerCommands(this, { clients, projects, tasks }, { tasks: taskService });
    registerDashboard(this, store);
    registerIndexEvents(this, () => indexer.rebuild());
  }
}
