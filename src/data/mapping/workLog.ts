import { parseDuration } from "../../domain/rules/duration";
import { parseWikilinkTarget } from "./wikilink";

export interface WorkLogEntry {
  /** What the heading's link points at, still unresolved: "Fix mapping". */
  taskLinkPath: string;
  /** Undefined when the heading has no time after the link. */
  minutes: number | undefined;
  /** 1-based line number in the note. */
  line: number;
}

export interface WorkLogProblem {
  line: number;
  reason: string;
}

export interface WorkLog {
  /** False when the note has no "Work Log" section. */
  hasSection: boolean;
  entries: WorkLogEntry[];
  problems: WorkLogProblem[];
}

const SECTION_TITLE = "work_log";
const HEADING = /^(#{1,6})\s+(.+?)\s*$/;
const FENCE = /^\s*(```|~~~)/;
const LEADING_LINK = /^(\[\[[^\]]*\]\])(.*)$/;
// Whitespace, hyphen, en dash, em dash, colon or pipe between the link and the time.
const SEPARATOR = /^[\s\-\u2013\u2014:|]+/;

/**
 * Reads the task headings in a daily note's "## Work Log" section.
 * A task heading is a level 3 heading that starts with a link, optionally followed by
 * a time: "## [[Fix mapping]] 1h 30m".
 *
 * Headings with no link at all are ignored. Headings inside code blocks are ignored.
 * Everything outside the Work Log section is ignored.
 */
export function parseWorkLog(text: string): WorkLog {
  const lines = text.split(/\r?\n/);
  const entries: WorkLogEntry[] = [];
  const problems: WorkLogProblem[] = [];
  let hasSection = false;
  let inSection = false;
  let inFence = false;

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? "";
    const line = index + 1;

    if (FENCE.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const heading = HEADING.exec(raw);
    if (heading === null) continue;
    const level = heading[1]?.length ?? 0;
    const title = heading[2] ?? "";

    if (level <= 2) {
      inSection = level === 2 && title.toLowerCase() === SECTION_TITLE;
      if (inSection) hasSection = true;
      continue;
    }
    if (!inSection || level !== 3) continue;

    const link = LEADING_LINK.exec(title);
    if (link === null) {
      if (title.includes("[[")) {
        problems.push({
          line,
          reason: "Start the heading with the task link, then the time.",
        });
      }
      continue;
    }

    const target = parseWikilinkTarget(link[1]);
    if (target === undefined) {
      problems.push({ line, reason: "The task link is empty." });
      continue;
    }

    const rest = (link[2] ?? "").replace(SEPARATOR, "").trim();
    if (rest === "") {
      entries.push({ taskLinkPath: target, minutes: undefined, line });
      continue;
    }

    const duration = parseDuration(rest);
    if (!duration.ok) {
      problems.push({
        line,
        reason: `Could not read the time after the link. ${duration.reason}`,
      });
      continue;
    }
    entries.push({ taskLinkPath: target, minutes: duration.value, line });
  }

  return { hasSection, entries, problems };
}
