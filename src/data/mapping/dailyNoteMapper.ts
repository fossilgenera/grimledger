import type { DailyNote } from "../../domain/models/dailyNote";
import { fail, ok, type Result } from "../../domain/result";
import type { IsoDate } from "../../domain/types";
import { noteNameOf } from "../VaultLayout";
import { readRequiredIsoDate } from "./fields";

type Frontmatter = Readonly<Record<string, unknown>> | undefined;

export function dailyNoteFromFrontmatter(
  path: string,
  frontmatter: Frontmatter,
): Result<DailyNote> {
  if (frontmatter?.["type"] !== "daily_note") {
    return fail('Not a daily note: "type" is not "daily_note".');
  }
  const date = readRequiredIsoDate(frontmatter["date"], "date");
  if (!date.ok) {
    return date;
  }
  return ok({ path, name: noteNameOf(path), date: date.value });
}

/** Daily notes are create-only, so there is no mutable-fields writer. */
export function dailyNoteToFrontmatter(date: IsoDate): Record<string, unknown> {
  return { type: "daily_note", date };
}
