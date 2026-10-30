import type { IsoDate } from "../types";
import { dayOfWeek } from "./isoDate";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function nameAt(names: readonly string[], index: number): string {
  const name = names[index];
  if (name === undefined) {
    throw new Error(`No name for index ${index}`);
  }
  return name;
}

/**
 * "Tuesday 27 October 2026". Fixed English names, so the result never
 * depends on the machine's locale. Throws on an invalid date.
 */
export function formatLongDate(date: IsoDate): string {
  // dayOfWeek validates the date, so the slices below are safe.
  const weekday = nameAt(WEEKDAYS, dayOfWeek(date));
  const month = nameAt(MONTHS, Number(date.slice(5, 7)) - 1);
  return `${weekday} ${Number(date.slice(8, 10))} ${month} ${date.slice(0, 4)}`;
}

/**
 * The text of a new daily note, without its properties (Obsidian writes
 * those). The work log holds a hidden hint, not an example heading, so a
 * fresh note contains no task link for the plugin to misread later.
 */
export function dailyNoteBody(date: IsoDate): string {
  return [
    `# ${formatLongDate(date)}`,
    "",
    "## Plan",
    "",
    "Focus (one to three things that would make today a good day):",
    "",
    "- ",
    "",
    "Tasks to move today:",
    "",
    "- [ ] ",
    "",
    "## Work log",
    "",
    "<!-- One heading per task: type ### then [[ to search for the task, then the time, for example 1h 30m. -->",
    "",
    "## Learned",
    "",
    "- ",
    "",
    "## Wins",
    "",
    "- ",
    "",
    "## Notes",
    "",
    "- ",
    "",
    "## Tomorrow",
    "",
    "- ",
    "",
  ].join("\n");
}
