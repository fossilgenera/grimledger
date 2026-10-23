import { Task } from "../../domain/models/task";
import { Result } from "../../domain/result";
import { EntityRef, IsoDate, Priority } from "../../domain/types";
import { ListResult } from "./ListResult";
import type { Recurrence } from "../../domain/rules/recurrence";

export interface NewTaskInput {
  project: EntityRef;
  name: string;
  priority: Priority;
  due?: IsoDate;
  estimatedMinutes?: number;
  recurrence?: Recurrence;
  created: IsoDate;
}
export interface TaskRepository {
  list(): ListResult<Task>;
  create(input: NewTaskInput): Promise<Result<Task>>;
  /**
   * Writes the task's mutable fields (status, priority, due, estimate, completed,
   * outcome) to its note. Writes absolute values so repeating the call is safe. Never changes
   * type, project or created.
   */
  update(task: Task): Promise<Result<Task>>;
}
