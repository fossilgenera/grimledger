import { describe, expect, it } from "vitest";
import {
  buildIndex,
  type LinkResolver,
  type NoteSnapshot,
} from "../../../src/data/index/buildIndex";

const FOLDER = "Work/Clients/ABC Bank/Projects/MRI Reporting";
const TASK_PATH = `${FOLDER}/Tasks/Fix mapping.md`;
const OTHER_PATH = `${FOLDER}/Notes/Something.md`;
const BLOCKER_PATH = `${FOLDER}/Blockers/2026-10-04 Fix mapping.md`;

const resolve: LinkResolver = (linkPath) => {
  if (linkPath === "Fix mapping") return TASK_PATH;
  if (linkPath === "Something") return OTHER_PATH;
  return undefined;
};

// A task note that claims its type but is otherwise incomplete (invalid).
const brokenTaskNote: NoteSnapshot = {
  path: TASK_PATH,
  frontmatter: { type: "task" },
};

const otherNote: NoteSnapshot = {
  path: OTHER_PATH,
  frontmatter: { type: "note" },
};

function blockerNote(overrides: Record<string, unknown> = {}): NoteSnapshot {
  return {
    path: BLOCKER_PATH,
    frontmatter: {
      type: "blocker",
      task: "[[Fix mapping]]",
      since: "2026-10-04",
      until: "2026-10-06",
      blocked_by: null,
      waiting_on: "Credentials",
      ...overrides,
    },
  };
}

describe("buildIndex: blockers", () => {
  it("maps a blocker and resolves its task", () => {
    const index = buildIndex([brokenTaskNote, blockerNote()], resolve);
    expect(index.blockers.skipped).toEqual([]);
    expect(index.blockers.items).toHaveLength(1);
    expect(index.blockers.items[0]?.task).toEqual({
      path: TASK_PATH,
      name: "Fix mapping",
    });
  });

  it("keeps a blocker valid when its task note is itself invalid", () => {
    const index = buildIndex([brokenTaskNote, blockerNote()], resolve);
    expect(index.tasks.skipped).toHaveLength(1);
    expect(index.blockers.items).toHaveLength(1);
  });

  it("skips a blocker whose link does not resolve", () => {
    const index = buildIndex([blockerNote({ task: "[[Missing]]" })], resolve);
    expect(index.blockers.items).toHaveLength(0);
    expect(index.blockers.skipped[0]?.reason).toContain("does not resolve");
  });

  it("skips a blocker that points at a note that is not a task", () => {
    const index = buildIndex(
      [otherNote, blockerNote({ task: "[[Something]]" })],
      resolve,
    );
    expect(index.blockers.items).toHaveLength(0);
    expect(index.blockers.skipped[0]?.reason).toContain("not a task");
  });

  it("skips a blocker with invalid frontmatter", () => {
    const index = buildIndex(
      [brokenTaskNote, blockerNote({ until: "2026-10-01" })],
      resolve,
    );
    expect(index.blockers.items).toHaveLength(0);
    expect(index.blockers.skipped[0]?.reason).toContain("until");
  });
});