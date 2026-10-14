import { Project } from "../domain/models/project";
import { Task } from "../domain/models/task";
import { IsoDate } from "../domain/types";
import { blockedTasks } from "./blockedTasks";
import { overdueTasks, tasksDueToday, upcomingTasks } from "./dueTasks";

/** A task plus the "Client / Project" text shown under its name. */
export interface TaskRow {
    task: Task;
    context: string;
}

export interface TaskSections {
    overdue: TaskRow[];
    dueToday: TaskRow[];
    blocked: TaskRow[];
    upcoming: TaskRow[];
}

/**
 * The four task sections of the dashboard.
 */
export function taskSections(
    tasks: readonly Task[],
    projects: readonly Project[],
    today: IsoDate,
): TaskSections {
    // Keyed by path - same-named projects under different clients stay apart.
    const clientNameByProjectPath = new Map<string, string>(
        projects.map((project): [string, string] => [project.path, project.client.name]),
    );

    const rowOf = (task: Task): TaskRow => {
        const clientName = clientNameByProjectPath.get(task.project.path);
        const context = 
            clientName === undefined
                ? task.project.name
                : `${clientName} / ${task.project.name}`;
        return { task, context };
    }

    return {
        overdue: overdueTasks(tasks, today).map(rowOf),
        dueToday: tasksDueToday(tasks, today).map(rowOf),
        blocked: blockedTasks(tasks).map(rowOf),
        upcoming: upcomingTasks(tasks, today).map(rowOf),
    };
}

/** True when there is nothing to show in any of the four sections. */
export function hasNoTasks(sections: TaskSections): boolean {
    return (
        sections.overdue.length === 0 &&
        sections.blocked.length === 0 &&
        sections.dueToday.length === 0 &&
        sections.upcoming.length === 0
    );
}