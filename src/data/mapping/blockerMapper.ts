import type { Blocker } from "../../domain/models/blocker";
import { fail, ok, type Result } from "../../domain/result";
import type { IsoDate } from "../../domain/types";
import { noteNameOf } from "../VaultLayout";
import { describeValue, readOptionalText, readRequiredIsoDate } from "./fields";
import { parseWikilinkTarget } from "./wikilink";

type Frontmatter = Readonly<Record<string, unknown>> | undefined;

/** A `Blocker` whose task is still an unresolved link target. */
export type BlockerRecord = Omit<Blocker, "task"> & { taskLinkPath: string };

export function blockerFromFrontmatter(
  path: string,
  frontMatter: Frontmatter,
): Result<BlockerRecord> {
  if (frontMatter?.["type"] !== "blocker") {
    return fail('Not a blocker note: "type" is not "blocker".');
  }

  const taskLinkPath = parseWikilinkTarget(frontMatter["task"]);
  if (taskLinkPath === undefined) {
    return fail(`Invalid task link: ${describeValue(frontMatter["task"])}`);
  }

  const since = readRequiredIsoDate(frontMatter["since"], "since");
  if (!since.ok) {
    return since;
  }
  const until = readRequiredIsoDate(frontMatter["until"], "until");
  if (!until.ok) {
    return until;
  }
  if (until.value < since.value) {
    return fail("until cannot be before since");
  }

  const blockedBy = readOptionalText(frontMatter["blocked_by"], "blocked_by");
  if (!blockedBy.ok) {
    return blockedBy;
  }
  const waitingOn = readOptionalText(frontMatter["waiting_on"], "waiting_on");
  if (!waitingOn.ok) {
    return waitingOn;
  }

  return ok({
    path,
    name: noteNameOf(path),
    taskLinkPath,
    since: since.value,
    until: until.value,
    blockedBy: blockedBy.value,
    waitingOn: waitingOn.value,
  });
}

export interface BlockerWriteInput {
  /** A ready-made wikilink string such as "[[Fix mapping]]" */
  taskLink: string;
  since: IsoDate;
  until: IsoDate;
  blockedBy: string | undefined;
  waitingOn: string | undefined;
}

/** Blockers are create-only, so there is no mutable-fields writer. */
export function blockerToFrontmatter(
  input: BlockerWriteInput,
): Record<string, unknown> {
  return {
    type: "blocker",
    task: input.taskLink,
    since: input.since,
    until: input.until,
    blocked_by: input.blockedBy ?? null,
    waiting_on: input.waitingOn ?? null,
  };
}
