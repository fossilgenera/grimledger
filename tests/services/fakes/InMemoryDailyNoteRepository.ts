import type { DailyNoteRepository } from "../../../src/data/repositories/DailyNoteRepository";
import type { ListResult } from "../../../src/data/repositories/ListResult";
import { dailyNotePath, noteNameOf } from "../../../src/data/VaultLayout";
import type { DailyNote } from "../../../src/domain/models/dailyNote";
import { fail, ok, type Result } from "../../../src/domain/result";

/** In-memory stand-in that mirrors the real contract: ensure creates once, then returns the same note. */
export class InMemoryDailyNoteRepository implements DailyNoteRepository {
  private readonly notes = new Map<string, DailyNote>();
  readonly ensuredDates: string[] = [];
  createdCount = 0;
  /** When set, ensure() fails with this reason without writing. */
  failure: string | undefined = undefined;

  list(): ListResult<DailyNote> {
    return { items: [...this.notes.values()], skipped: [] };
  }

  async ensure(date: string): Promise<Result<DailyNote>> {
    this.ensuredDates.push(date);
    if (this.failure !== undefined) {
      return fail(this.failure);
    }
    const existing = this.notes.get(date);
    if (existing !== undefined) {
      return ok(existing);
    }
    const path = dailyNotePath(date);
    const note: DailyNote = { path, name: noteNameOf(path), date };
    this.notes.set(date, note);
    this.createdCount += 1;
    return ok(note);
  }
}