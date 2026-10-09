import { Notice, Plugin, type App } from "obsidian";
import { ClientRepository } from "../data/repositories/ClientRepository";
import { ProjectRepository } from "../data/repositories/ProjectRepository";
import type { TaskRepository } from "../data/repositories/TaskRepository";
import { labelTasks, type LabelledTask } from "../queries/labelTasks";
import { openTasks } from "../queries/openTasks";
import { projectsAcceptingTasks } from "../queries/projectsAcceptingTasks";
import type { TaskService } from "../services/TaskService";
import { CompleteTaskModal } from "../ui/modals/CompleteTaskModal";
import { CreateClientModal } from "../ui/modals/CreateClientModal";
import { CreateProjectModal } from "../ui/modals/CreateProjectModal";
import { CreateTaskModal } from "../ui/modals/CreateTaskModal";
import { TaskPickerModal } from "../ui/modals/TaskPickerModal";

export interface Repositories {
    clients: ClientRepository;
    projects: ProjectRepository;
    tasks: TaskRepository;
}

export interface Services {
    tasks: TaskService;
}

/** Lists open tasks, lets the user pick one, then hands the choice to onChoose. */
function pickOpenTask(
    app: App,
    repositories: Repositories,
    onChoose: (chosen: LabelledTask) => void,
): void {
    const open = openTasks(repositories.tasks.list().items);
    if (open.length === 0) {
        new Notice("No open tasks.");
        return;
    }
    // All projects, not only those accepting tasks: a task inside a completed
    // project still needs its client label.
    const labelled = labelTasks(open, repositories.projects.list().items);
    new TaskPickerModal(app, labelled, onChoose).open();
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

    plugin.addCommand({
        id: "complete-task",
        name: "Complete task",
        callback: () => {
            pickOpenTask(plugin.app, repositories, (chosen) => {
                new CompleteTaskModal(plugin.app, services.tasks, chosen).open();
            });
        },
    });
}