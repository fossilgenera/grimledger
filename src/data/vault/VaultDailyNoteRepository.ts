import type { App } from "obsidian";
import type { DailyNoteRepository } from "../repositories/DailyNoteRepository";
import type { IndexStore } from "../index/IndexStore";
import { copyListResult, type ListResult } from "../repositories/ListResult";
import type { IsoDate } from "../../domain/types";
import { fail, ok, type Result } from "../../domain/result";
import { isIsoDate } from "../../domain/rules/isoDate";
import { dailyFolderPath, dailyNotePath, noteNameOf } from "../VaultLayout";
import type { DailyNote } from "../../domain/models/dailyNote";
import { ensureFolder } from "./ensureFolder";
import { dailyNoteBody } from "../../domain/rules/dailyNoteTemplate";
import { dailyNoteToFrontmatter } from "../mapping/dailyNoteMapper";

export class VaultDailyNoteRepository implements DailyNoteRepository {
  constructor(
    private readonly app: App,
    private readonly store: IndexStore,
  ) {}

  list(): ListResult<DailyNote> {
    return copyListResult(this.store.snapshot.dailyNotes);
  }

  async ensure(date: IsoDate): Promise<Result<DailyNote>> {
    if (!isIsoDate(date)) {
      return fail(`"${date}" is not a real date.`);
    }

    const path = dailyNotePath(date);
    const note: DailyNote = { path, name: noteNameOf(path), date };

    // Looks at the real vault, not the index, which lags behind writes.
    if (this.app.vault.getAbstractFileByPath(path) !== null) {
      return ok(note);
    }

    await ensureFolder(this.app.vault, dailyFolderPath(date));
    const file = await this.app.vault.create(path, dailyNoteBody(date));
    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      Object.assign(frontmatter, dailyNoteToFrontmatter(date));
    });

    return ok(note);
  }
}
