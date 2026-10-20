import { Notice, Plugin, type App } from "obsidian";
import { ClientRepository } from "../data/repositories/ClientRepository";
import { ProjectRepository } from "../data/repositories/ProjectRepository";
import type { TaskRepository } from "../data/repositories/TaskRepository";
import type { Task } from "../domain/models/task";
import { allowedStatusChanges } from "../domain/rules/taskStatus";
import { labelTasks, type LabelledTask } from "../queries/labelTasks";
import { openTasks } from "../queries/openTasks";
import { projectsAcceptingTasks } from "../queries/projectsAcceptingTasks";
import type { TaskService } from "../services/TaskService";
import { ChangeStatusModal } from "../ui/modals/ChangeStatusModal";
import { CompleteTaskModal } from "../ui/modals/CompleteTaskModal";
import { CreateClientModal } from "../ui/modals/CreateClientModal";
import { CreateProjectModal } from "../ui/modals/CreateProjectModal";
import { CreateTaskModal } from "../ui/modals/CreateTaskModal";
import { statusLabel } from "../ui/modals/statusLabel";
import { TaskPickerModal } from "../ui/modals/TaskPickerModal";
import type { ProjectService } from "../services/ProjectService";
import {
  focusCandidates,
  type FocusCandidate,
} from "../queries/focusCandidates";
import { ProjectPickerModal } from "../ui/modals/ProjectPickerModal";
import type { SessionService } from "../services/SessionService";
import type { CompletionService } from "../services/CompletionService";
import { LogTimeModal } from "../ui/modals/LogTimeModal";
import type { IsoDate } from "../domain/types";

export interface Repositories {
  clients: ClientRepository;
  projects: ProjectRepository;
  tasks: TaskRepository;
}

export interface Services {
  tasks: TaskService;
  projects: ProjectService;
  sessions: SessionService;
  completion: CompletionService;
}

/**
 * Labels the given tasks, lets the user pick one, then hands the choice to onChoose.
 * With showStatus, each label ends with the task's current status.
 */
function pickTask(
  app: App,
  repositories: Repositories,
  tasks: readonly Task[],
  emptyMessage: string,
  onChoose: (chosen: LabelledTask) => void,
  showStatus = false,
): void {
  if (tasks.length === 0) {
    new Notice(emptyMessage);
    return;
  }
  // All projects, not only those accepting tasks: a task inside a completed
  // project still needs its client label.
  const labelled = labelTasks(tasks, repositories.projects.list().items);
  const choices = showStatus
    ? labelled.map(
        ({ task, label }): LabelledTask => ({
          task,
          label: `${label} (${statusLabel(task.status)})`,
        }),
      )
    : labelled;
  new TaskPickerModal(app, choices, onChoose).open();
}

/** Flips the chosen project's current-focus flag and tells the user what happened. */
async function toggleCurrentFocus(
  services: Services,
  chosen: FocusCandidate,
): Promise<void> {
  const target = !chosen.project.currentFocus;
  const result = await services.projects.setCurrentFocus(
    chosen.project.path,
    target,
  );
  if (!result.ok) {
    new Notice(result.reason);
    return;
  }
  new Notice(
    `${result.value.name} is ${target ? "now" : "no longer"} current focus.`,
  );
}

export function registerCommands(
  plugin: Plugin,
  repositories: Repositories,
  services: Services,
  today: () => IsoDate,
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
      const projects = projectsAcceptingTasks(
        repositories.projects.list().items,
      );
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
      pickTask(
        plugin.app,
        repositories,
        openTasks(repositories.tasks.list().items),
        "No open tasks.",
        (chosen) => {
          new CompleteTaskModal(plugin.app, services.completion, chosen).open();
        },
      );
    },
  });

  plugin.addCommand({
    id: "change-task-status",
    name: "Change task status",
    callback: () => {
      pickTask(
        plugin.app,
        repositories,
        repositories.tasks.list().items,
        "No tasks.",
        (chosen) => {
          // Completing goes through "Complete task", which records the outcome.
          const targets = allowedStatusChanges(chosen.task.status).filter(
            (status) => status !== "complete",
          );
          if (targets.length === 0) {
            new Notice("No status changes are available for this task.");
            return;
          }
          new ChangeStatusModal(
            plugin.app,
            services.tasks,
            chosen,
            targets,
          ).open();
        },
        true,
      );
    },
  });

  plugin.addCommand({
    id: "toggle-project-current-focus",
    name: "Toggle project current focus",
    callback: () => {
      const candidates = focusCandidates(repositories.projects.list().items);
      if (candidates.length === 0) {
        new Notice("No active projects.");
        return;
      }
      new ProjectPickerModal(plugin.app, candidates, (chosen) => {
        toggleCurrentFocus(services, chosen).catch((error: unknown) => {
          console.error("Grimledger: could not change current focus", error);
          new Notice(
            "Could not change current focus. See the developer console.",
          );
        });
      }).open();
    },
  });

  plugin.addCommand({
    id: "log-time",
    name: "Log time",
    callback: () => {
      pickTask(
        plugin.app,
        repositories,
        repositories.tasks.list().items,
        "No tasks.",
        (chosen) => {
          new LogTimeModal(
            plugin.app,
            services.sessions,
            chosen,
            today(),
          ).open();
        },
        true,
      );
    },
  });
}
