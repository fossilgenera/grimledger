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
import { ProjectService } from "./services/ProjectService";
import { VaultWorkSessionRepository } from "./data/vault/VaultWorkSessionRepository";
import { SessionService } from "./services/SessionService";
import { CompletionService } from "./services/CompletionService";
import { VaultBlockerRepository } from "./data/vault/VaultBlockerRepository";

export default class GrimledgerPlugin extends Plugin {
  override async onload(): Promise<void> {
    const store = new IndexStore();
    const indexer = new VaultIndexer(this.app, store);

    const clients = new VaultClientRepository(this.app, store);
    const projects = new VaultProjectRepository(this.app, store);
    const tasks = new VaultTaskRepository(this.app, store);
    const workSessions = new VaultWorkSessionRepository(this.app, store);
    const blockers = new VaultBlockerRepository(this.app, store);

    const today = () => formatIsoDate(new Date());

    const taskService = new TaskService(tasks, today, blockers);
    const projectService = new ProjectService(projects);
    const sessionService = new SessionService(tasks, workSessions, today);
    const completionService = new CompletionService(
      tasks,
      taskService,
      sessionService,
      today,
    );

    registerCommands(
      this,
      { clients, projects, tasks },
      {
        tasks: taskService,
        projects: projectService,
        sessions: sessionService,
        completion: completionService,
      },
      today,
    );
    registerDashboard(this, store, today);
    registerIndexEvents(this, () => indexer.rebuild());
  }
}
