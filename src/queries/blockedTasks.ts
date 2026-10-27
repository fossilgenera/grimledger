import { Task } from "../domain/models/task";
import { compareText } from "./sorting";

/** Oldest block first. Tasks with no blocked since date come last. */
function compareSince(a: Task, b: Task): number {
  if (a.blockedSince === b.blockedSince) return 0;
  if (a.blockedSince === undefined) return 1;
  if (b.blockedSince === undefined) return -1;
  return a.blockedSince < b.blockedSince ? -1 : 1;
}

export function blockedTasks(tasks: readonly Task[]): Task[] {
  return tasks
    .filter((task) => task.status === "blocked")
    .sort((a, b) => compareSince(a, b) || compareText(a.path, b.path));
}
