import { Task } from "../domain/models/task";
import { compareText } from "./sorting";

export function blockedTasks(tasks: readonly Task[]): Task[] {
    return tasks
        .filter((task) => task.status === "blocked")
        .sort((a, b) => compareText(a.path, b.path));
}