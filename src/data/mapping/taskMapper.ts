import { fail, ok, type Result } from "../../domain/result";
import { Task } from "../../domain/models/task";
import { parseWikilinkTarget } from "./wikilink";
import {
  describeValue,
  isOneOf,
  readOptionalIsoDate,
  readOptionalPositiveInteger,
  readOptionalText,
  readRequiredIsoDate,
} from "./fields";
import { PRIORITIES, TASK_STATUSES } from "../../domain/types";
import {
  validateRecurrence,
  type Recurrence,
} from "../../domain/rules/recurrence";
import { noteNameOf } from "../VaultLayout";

type Frontmatter = Readonly<Record<string, unknown>> | undefined;

/** A `Task` whose project is still an unresolved link target. */
export type TaskRecord = Omit<Task, "project"> & { projectLinkPath: string };

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

/** Both keys empty is "no recurrence". Exactly one of them set is a failure. */
function readRecurrence(
  unit: unknown,
  every: unknown,
): Result<Recurrence | undefined> {
  if (isBlank(unit) && isBlank(every)) {
    return ok(undefined);
  }
  if (isBlank(unit) || isBlank(every)) {
    return fail(
      "recurrence: recurrence_unit and recurrence_every must both be set, or both be empty",
    );
  }
  const result = validateRecurrence(unit, every);
  return result.ok ? result : fail(`recurrence: ${result.reason}`);
}

export function taskFromFrontmatter(
  path: string,
  frontMatter: Frontmatter,
): Result<TaskRecord> {
  if (frontMatter?.["type"] !== "task") {
    return fail('Not a task note: "type" is not "task".');
  }

  const projectLinkPath = parseWikilinkTarget(frontMatter["project"]);
  if (projectLinkPath === undefined) {
    return fail(
      `Invalid project link: ${describeValue(frontMatter["project"])}`,
    );
  }
  const status = frontMatter["status"];
  if (!isOneOf(TASK_STATUSES, status)) {
    return fail(`Invalid status ${describeValue(status)}`);
  }
  const priority = frontMatter["priority"];
  if (!isOneOf(PRIORITIES, priority)) {
    return fail(`Invalid priority ${describeValue(priority)}`);
  }

  const due = readOptionalIsoDate(frontMatter["due"]);
  if (!due.ok) {
    return fail(`due: ${due.reason}`);
  }

  const estimatedMinutes = readOptionalPositiveInteger(
    frontMatter["estimated_minutes"],
    "estimated_minutes",
  );
  if (!estimatedMinutes.ok) {
    return estimatedMinutes;
  }

  const created = readRequiredIsoDate(frontMatter["created"], "created");
  if (!created.ok) {
    return created;
  }

  const completed = readOptionalIsoDate(frontMatter["completed"]);
  if (!completed.ok) {
    return fail(`completed: ${completed.reason}`);
  }

  const outcome = readOptionalText(frontMatter["outcome"], "outcome");
  if (!outcome.ok) {
    return outcome;
  }

  const blockedSince = readOptionalIsoDate(frontMatter["blocked_since"]);
  if (!blockedSince.ok) {
    return fail(`blocked_since: ${blockedSince.reason}`);
  }

  const blockedBy = readOptionalText(frontMatter["blocked_by"], "blocked_by");
  if (!blockedBy.ok) {
    return blockedBy;
  }

  const waitingOn = readOptionalText(frontMatter["waiting_on"], "waiting_on");
  if (!waitingOn.ok) {
    return waitingOn;
  }

  const expectedResolution = readOptionalIsoDate(
    frontMatter["expected_resolution"],
  );
  if (!expectedResolution.ok) {
    return fail(`expected_resolution: ${expectedResolution.reason}`);
  }

  const recurrence = readRecurrence(
    frontMatter["recurrence_unit"],
    frontMatter["recurrence_every"],
  );
  if (!recurrence.ok) {
    return recurrence;
  }

  return ok({
    path,
    name: noteNameOf(path),
    projectLinkPath,
    status,
    priority,
    due: due.value,
    estimatedMinutes: estimatedMinutes.value,
    created: created.value,
    completed: completed.value,
    outcome: outcome.value,
    blockedSince: blockedSince.value,
    blockedBy: blockedBy.value,
    waitingOn: waitingOn.value,
    expectedResolution: expectedResolution.value,
    recurrence: recurrence.value,
  });
}

/** The fields that can change after a task has been created. */
export interface TaskMutableFields {
  status: Task["status"];
  priority: Task["priority"];
  due: Task["due"];
  estimatedMinutes: Task["estimatedMinutes"];
  completed: Task["completed"];
  outcome: Task["outcome"];
  blockedSince: Task["blockedSince"];
  blockedBy: Task["blockedBy"];
  waitingOn: Task["waitingOn"];
  expectedResolution: Task["expectedResolution"];
}

/** Absent values become null so that writing them overwrites any old value. */
export function taskMutableToFrontmatter(
  fields: TaskMutableFields,
): Record<string, unknown> {
  return {
    status: fields.status,
    priority: fields.priority,
    due: fields.due ?? null,
    estimated_minutes: fields.estimatedMinutes ?? null,
    completed: fields.completed ?? null,
    outcome: fields.outcome ?? null,
    blocked_since: fields.blockedSince ?? null,
    blocked_by: fields.blockedBy ?? null,
    waiting_on: fields.waitingOn ?? null,
    expected_resolution: fields.expectedResolution ?? null,
  };
}

export interface TaskWriteInput extends TaskMutableFields {
  /** A ready-made wikilink string such as "[[MRI Reporting]]" */
  projectLink: string;
  created: Task["created"];
  /** Written only when the note is created. Never part of an update. */
  recurrence: Task["recurrence"];
}

/** Everything the plugin owns, for a brand new note. */
export function taskToFrontmatter(
  input: TaskWriteInput,
): Record<string, unknown> {
  return {
    type: "task",
    project: input.projectLink,
    created: input.created,
    recurrence_unit: input.recurrence?.unit ?? null,
    recurrence_every: input.recurrence?.every ?? null,
    ...taskMutableToFrontmatter(input),
  };
}
