import { Notice, Plugin } from "obsidian";
import { ClientRepository } from "../data/repositories/ClientRepository";
import { ProjectRepository } from "../data/repositories/ProjectRepository";
import { CreateClientModal } from "../ui/modals/CreateClientModal";
import { CreateProjectModal } from "../ui/modals/CreateProjectModal";

export interface Repositories {
    clients: ClientRepository;
    projects: ProjectRepository;
}

export function registerCommands(plugin: Plugin, repositories: Repositories): void {
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
}