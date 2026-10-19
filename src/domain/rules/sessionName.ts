import { IsoDate } from "../types";

/**
 * Picks the note name for a new work session: "<date> <task name>",
 * with " 2", " 3",... appended when that name is already used.
 * `existingNames` are note names without the ".md" extension.
 * Comparison ignores letter case.
 */
export function nextSessionName(
    date: IsoDate,
    taskName: string,
    existingNames: readonly string[],
): string {
    const taken = new Set(existingNames.map((name) => name.toLocaleLowerCase()));
    const base = `${date} ${taskName}`;

    if (!taken.has(base.toLowerCase())) {
        return base;
    }

    let counter = 2;
    while (taken.has(`${base} ${counter}`.toLowerCase())) {
        counter += 1;
    }
    return `${base} ${counter}`;
}