import type { IndexSnapshot } from "../../data/index/buildIndex";
import type { SkippedNote } from "../../data/repositories/ListResult";

export type SkippedKind =
  | "client"
  | "project"
  | "task"
  | "work session"
  | "blocker";

export interface SkippedEntry extends SkippedNote {
  kind: SkippedKind;
}

function withKind(
  notes: readonly SkippedNote[],
  kind: SkippedKind,
): SkippedEntry[] {
  return notes.map((note) => ({ ...note, kind }));
}

/** Every skipped note from the index in one list, sorted by path. */
export function collectSkipped(index: IndexSnapshot): SkippedEntry[] {
  return [
    ...withKind(index.clients.skipped, "client"),
    ...withKind(index.projects.skipped, "project"),
    ...withKind(index.tasks.skipped, "task"),
    ...withKind(index.workSessions.skipped, "work session"),
    ...withKind(index.blockers.skipped, "blocker"),
  ].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/** "1 note skipped", "3 notes skipped". */
export function describeSkippedCount(count: number): string {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`Count must be a whole number, zero or more: ${count}`);
  }
  return `${count} ${count === 1 ? "note" : "notes"} skipped`;
}
