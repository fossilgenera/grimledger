import type { Blocker } from "../../domain/models/blocker";
import type { Task } from "../../domain/models/task";
import type { Result } from "../../domain/result";
import type { IsoDate } from "../../domain/types";
import type { ListResult } from "./ListResult";

export interface NewBlockerInput {
  /** The task the block belonged to. Its project decides where the record is stored. */
  task: Task;
  since: IsoDate;
  until: IsoDate;
  blockedBy?: string | undefined;
  waitingOn?: string | undefined;
}

export interface BlockerRepository {
  list(): ListResult<Blocker>;
  create(input: NewBlockerInput): Promise<Result<Blocker>>;
}