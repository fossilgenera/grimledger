import { describe, expect, it } from "vitest";
import {
  buildIndex,
  type LinkResolver,
  type NoteSnapshot,
} from "../../../src/data/index/buildIndex";
import { noteNameOf } from "../../../src/data/VaultLayout";

type Frontmatter = Record<string, unknown>;

const MRI_PATH =
  "Work/Clients/ABC Bank/Projects/MRI Reporting/MRI Reporting.md";
const FIX_PATH =
  "Work/Clients/ABC Bank/Projects/MRI Reporting/Tasks/Fix mapping.md";
const SESSIONS_FOLDER =
  "Work/Clients/ABC Bank/Projects/MRI Reporting/Work Sessions";

const clientNote: NoteSnapshot = {
  path: "Work/Clients/ABC Bank/ABC Bank.md",
  frontmatter: { type: "client", status: "active" },
};

const projectNote: NoteSnapshot = {
  path: MRI_PATH,
  frontmatter: {
    type: "project",
    client: "[[ABC Bank]]",
    status: "active",
    priority: "high",
    start_date: "2026-09-15",
    current_focus: true,
  },
};

function taskNote(extra: Frontmatter = {}): NoteSnapshot {
  return {
    path: FIX_PATH,
    frontmatter: {
      type: "task",
      project: "[[MRI Reporting]]",
      status: "in-progress",
      priority: "high",
      due: "2026-10-06",
      estimated_minutes: 120,
      created: "2026-10-04",
      completed: null,
      outcome: null,
      ...extra,
    },
  };
}

function sessionNote(name: string, extra: Frontmatter = {}): NoteSnapshot {
  return {
    path: `${SESSIONS_FOLDER}/${name}.md`,
    frontmatter: {
      type: "work_session",
      task: "[[Fix mapping]]",
      date: "2026-10-04",
      minutes: 90,
      note: null,
      ...extra,
    },
  };
}

function resolveByName(notes: readonly NoteSnapshot[]): LinkResolver {
  return (linkPath) =>
    notes.find((note) => noteNameOf(note.path) === linkPath)?.path;
}

function build(notes: readonly NoteSnapshot[]) {
  return buildIndex(notes, resolveByName(notes));
}

describe("buildIndex: work sessions", () => {
  it("maps a session and resolves its task", () => {
    const index = build([
      clientNote,
      projectNote,
      taskNote(),
      sessionNote("2026-10-04 Fix mapping"),
    ]);
    expect(index.workSessions).toEqual({
      items: [
        {
          path: `${SESSIONS_FOLDER}/2026-10-04 Fix mapping.md`,
          name: "2026-10-04 Fix mapping",
          task: { path: FIX_PATH, name: "Fix mapping" },
          date: "2026-10-04",
          minutes: 90,
          note: undefined,
        },
      ],
      skipped: [],
    });
  });

  it("skips a session with invalid minutes", () => {
    const index = build([
      taskNote(),
      sessionNote("2026-10-04 Fix mapping", { minutes: 0 }),
    ]);
    expect(index.workSessions.items).toEqual([]);
    expect(index.workSessions.skipped).toHaveLength(1);
    expect(index.workSessions.skipped[0]?.reason).toContain("minutes");
  });

  it("skips a session whose task link does not resolve", () => {
    const index = build([
      sessionNote("2026-10-04 Ghost", { task: "[[Ghost task]]" }),
    ]);
    expect(index.workSessions.items).toEqual([]);
    expect(index.workSessions.skipped[0]?.reason).toContain("does not resolve");
  });

  it("skips a session whose task link points at a note that is not a task", () => {
    const index = build([
      clientNote,
      projectNote,
      sessionNote("2026-10-04 Wrong", { task: "[[MRI Reporting]]" }),
    ]);
    expect(index.workSessions.items).toEqual([]);
    expect(index.workSessions.skipped[0]?.reason).toContain("not a task note");
  });

  it("keeps a session when its task note is itself invalid (decision M4-9)", () => {
    const index = build([
      clientNote,
      projectNote,
      taskNote({ status: "nope" }),
      sessionNote("2026-10-04 Fix mapping"),
    ]);
    expect(index.tasks.items).toEqual([]);
    expect(index.workSessions.items.map((s) => s.task)).toEqual([
      { path: FIX_PATH, name: "Fix mapping" },
    ]);
  });

  it("orders sessions by path whatever the input order", () => {
    const index = build([
      taskNote(),
      sessionNote("2026-10-05 Fix mapping"),
      sessionNote("2026-10-03 Fix mapping"),
      sessionNote("2026-10-04 Fix mapping"),
    ]);
    expect(index.workSessions.items.map((s) => s.name)).toEqual([
      "2026-10-03 Fix mapping",
      "2026-10-04 Fix mapping",
      "2026-10-05 Fix mapping",
    ]);
  });
});