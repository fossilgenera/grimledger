import type { DailyNoteRepository } from "../data/repositories/DailyNoteRepository";
import type { DailyNote } from "../domain/models/dailyNote";
import type { Result } from "../domain/result";
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
}