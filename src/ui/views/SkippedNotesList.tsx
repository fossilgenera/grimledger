import { NoteLink } from "./NoteLink";
import { describeSkippedCount, type SkippedEntry } from "./skippedNotes";

interface SkippedNotesListProps {
  entries: readonly SkippedEntry[];
  onOpen: (path: string) => void;
}

/** A collapsible list of notes that could not be read. Draws nothing when there are none. */
export function SkippedNotesList({ entries, onOpen }: SkippedNotesListProps) {
  if (entries.length === 0) return null;

  return (
    <details className="grimledger-skipped">
      <summary>{describeSkippedCount(entries.length)}</summary>
      <p>
        These notes look like Grimledger notes but could not be read. Fix the
        property named in the reason.
      </p>
      <ul className="grimledger-list">
        {entries.map((entry) => (
          <li key={entry.path} className="grimledger-skipped-item">
            <NoteLink path={entry.path} text={entry.path} onOpen={onOpen} />
            <span className="grimledger-skipped-reason">
              {entry.kind}: {entry.reason}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}