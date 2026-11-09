import type { DailyNoteRepository } from "../data/repositories/DailyNoteRepository";
import type { DailyNote } from "../domain/models/dailyNote";
import { fail, type Result } from "../domain/result";
import type { IsoDate } from "../domain/types";

export class DailyNoteService {
  constructor(
    private readonly notes: DailyNoteRepository,
    private readonly today: () => IsoDate,
  ) {}

  /** Today's daily note created from the template if it does not exist yet. */
  ensureToday(): Promise<Result<DailyNote>> {
    return this.notes.ensure(this.today());
  }

  /** The daily note for a date, today or earlier. Dates after today are refused. */
  async ensureFor(date: IsoDate): Promise<Result<DailyNote>> {
    if (date > this.today()) {
      return fail(
        `Cannot open a daily note for a day after today (${this.today()}).`,
      );
    }
    return this.notes.ensure(date);
  }
}
