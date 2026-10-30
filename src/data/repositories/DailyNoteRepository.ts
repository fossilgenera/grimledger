import type { DailyNote } from "../../domain/models/dailyNote";
import type { Result } from "../../domain/result";
import type { IsoDate } from "../../domain/types";
import type { ListResult } from "./ListResult";

export interface DailyNoteRepository {
  list(): ListResult<DailyNote>;
  /**
   * The daily note for the date. Creates it from the template if it does not exist, otherweise
   * returns the existing one untouched. Safe to repeat.
   */
  ensure(date: IsoDate): Promise<Result<DailyNote>>;
}
