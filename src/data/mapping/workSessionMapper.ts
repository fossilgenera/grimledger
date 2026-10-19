import type { WorkSession } from "../../domain/models/workSession";
import { fail, ok, type Result } from "../../domain/result";
import { noteNameOf } from "../VaultLayout";
import { describeValue, readOptionalText, readRequiredIsoDate, readRequiredPositiveInteger } from "./fields";
import { parseWikilinkTarget } from "./wikilink";

type Frontmatter = Readonly<Record<string, unknown>> | undefined;

/** A `WorkSession` whose task is still an unresolved link target. */
export type WorkSessionRecord = Omit<WorkSession, "task"> & { taskLinkPath: string; };

export function workSessionFromFrontmatter(
    path: string,
    frontmatter: Frontmatter,
): Result<WorkSessionRecord> {
    if (frontmatter?.["type"] !== "work_session") {
        return fail('Not a work session note: "type" is not "work_session".');
    }

    const taskLinkPath = parseWikilinkTarget(frontmatter["task"]);
    if (taskLinkPath === undefined) {
        return fail(`Invalid task link: ${describeValue(frontmatter["task"])}`);
    }

    const date = readRequiredIsoDate(frontmatter["date"], "date");
    if (!date.ok) {
        return date;
    }

    const minutes = readRequiredPositiveInteger(frontmatter["minutes"], "minutes");
    if (!minutes.ok) {
        return minutes;
    }

    const note = readOptionalText(frontmatter["note"], "note");
    if (!note.ok) {
        return note;
    }

    return ok({
        path,
        name: noteNameOf(path),
        taskLinkPath,
        date: date.value,
        minutes: minutes.value,
        note: note.value,
    });
}

export interface WorkSessionWriteInput {
    /** A ready-made wikilink string such as "[[Fix mapping]]" */
    taskLink: string;
    date: WorkSession["date"];
    minutes: WorkSession["minutes"];
    note: WorkSession["note"];
}

/** Everything the plugin owns, for a brand new session note. */
export function workSessionToFrontmatter(
    input: WorkSessionWriteInput,
): Record<string, unknown> {
    return {
        type: "work_session",
        task: input.taskLink,
        date: input.date,
        minutes: input.minutes,
        note: input.note ?? null,
    };
}