import type { DailyNote } from "../domain/models/dailyNote";
import type { Task } from "../domain/models/task";
import type { WorkSession } from "../domain/models/workSession";
import type { EntityRef, IsoDate } from "../domain/types";
import { compareText } from "./sorting";

export interface TimeForTask {
  task: EntityRef;
  minutes: number;
}

export interface TodaySummary {
  hasDailyNote: boolean;
  totalMinutes: number;
  /** Time logged today per task, most time first. */
  time: TimeForTask[];
  /** Tasks completed today. */
  completed: Task[];
}

/** What the dashboard's Today section shows. Matching on path keeps same-named tasks apart. */
export function todaySummary(
  dailyNotes: readonly DailyNote[],
  sessions: readonly WorkSession[],
  tasks: readonly Task[],
  today: IsoDate,
): TodaySummary {
  const byTask = new Map<string, TimeForTask>();
  let totalMinutes = 0;

  for (const session of sessions) {
    if (session.date !== today) continue;
    totalMinutes += session.minutes;
    const entry = byTask.get(session.task.path);
    if (entry === undefined) {
      byTask.set(session.task.path, {
        task: session.task,
        minutes: session.minutes,
      });
    } else {
      entry.minutes += session.minutes;
    }
  }

  const time = [...byTask.values()].sort(
    (a, b) => b.minutes - a.minutes || compareText(a.task.path, b.task.path),
  );
  const completed = tasks
    .filter((task) => task.status === "complete" && task.completed === today)
    .sort((a, b) => compareText(a.path, b.path));

  return {
    hasDailyNote: dailyNotes.some((note) => note.date === today),
    totalMinutes,
    time,
    completed,
  };
}
