import type { Task } from "../../domain/models/task";
import type { WorkSession } from "../../domain/models/workSession";
import type { Result } from "../../domain/result";
import type { IsoDate } from "../../domain/types";
import type { ListResult } from "./ListResult";

export interface NewWorkSessionInput {
  /** The task the time was spent on. Session is stored in this task's project folder. */
  task: Task;
  date: IsoDate;
  minutes: number;
  note?: string;
}

export interface WorkSessionRepository {
  list(): ListResult<WorkSession>;
  create(input: NewWorkSessionInput): Promise<Result<WorkSession>>;
  /**
   * Writes the session's mutable fields (minutes, note) to its note.
   * Writes absolute values so repeating the call is safe. Never changes task, type or date.
   */
  update(session: WorkSession): Promise<Result<WorkSession>>;
}
