import { Notice, Plugin } from "obsidian";
import { ClientRepository } from "../data/repositories/ClientRepository";
import { ProjectRepository } from "../data/repositories/ProjectRepository";
import { projectsAcceptingTasks } from "../queries/projectsAcceptingTasks";
import type { TaskService } from "../services/TaskService";
import { CreateClientModal } from "../ui/modals/CreateClientModal";
import { CreateProjectModal } from "../ui/modals/CreateProjectModal";
import { CreateTaskModal } from "../ui/modals/CreateTaskModal";

export interface Repositories {
    clients: ClientRepository;
    projects: ProjectRepository;
}

export interface Services {
    tasks: TaskService;
}

export function registerCommands(
    plugin: Plugin,
    repositories: Repositories,
    services: Services,
): void {
    plugin.addCommand({
        id: "create-client",
        name: "Create client",
        callback: () => {
            new CreateClientModal(plugin.app, repositories.clients).open();
        },
    });

    plugin.addCommand({
        id: "create-project",
        name: "Create project",
        callback: () => {
            const { items } = repositories.clients.list();
            if (items.length === 0) {
                new Notice("Create a client first.");
                return;
            }
            new CreateProjectModal(plugin.app, repositories.projects, items).open();
        },
    });

    plugin.addCommand({
        id: "create-task",
        name: "Create task",
        callback: () => {
            const projects = projectsAcceptingTasks(repositories.projects.list().items);
            if (projects.length === 0) {
                new Notice("No active or paused projects. Create a project first.");
                return;
            }
            new CreateTaskModal(plugin.app, services.tasks, projects).open();
        },
    });
}