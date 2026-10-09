import { Project } from "../domain/models/project";
import { Task } from "../domain/models/task";

export interface LabelledTask {
    task: Task;
    /** For display and search, for example "ABC Bank / MRI Reporting / Fix mapping". */
    label: string;
}

export function labelTasks(
    tasks: readonly Task[],
    projects: readonly Project[],
): LabelledTask[] {
    const clientNameByProjectPath = new Map<string, string>(
        projects.map((project): [string, string] => [project.path, project.client.name]),
    );

    return tasks
        .map((task): LabelledTask => {
            const clientName = clientNameByProjectPath.get(task.project.path);
            const parts = 
                clientName === undefined
                    ? [task.project.name, task.name]
                    : [clientName, task.project.name, task.name];
            return { task, label: parts.join(" / ") };
        })
        .sort(
            (a, b) =>
                a.label.localeCompare(b.label) || a.task.path.localeCompare(b.task.path),
        );
}