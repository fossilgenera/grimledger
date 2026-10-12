import { describe, expect, it } from "vitest";
import {
  buildIndex,
  type LinkResolver,
  type NoteSnapshot,
} from "../../../src/data/index/buildIndex";
import { noteNameOf } from "../../../src/data/VaultLayout";

type Frontmatter = Record<string, unknown>;

const BANK_PATH = "Work/Clients/ABC Bank/ABC Bank.md";
const MRI_PATH =
  "Work/Clients/ABC Bank/Projects/MRI Reporting/MRI Reporting.md";
const FIX_PATH =
  "Work/Clients/ABC Bank/Projects/MRI Reporting/Tasks/Fix mapping.md";

function clientNote(name: string, extra: Frontmatter = {}): NoteSnapshot {
  return {
    path: `Work/Clients/${name}/${name}.md`,
    frontmatter: { type: "client", status: "active", ...extra },
  };
}

function projectNote(
  client: string,
  name: string,
  extra: Frontmatter = {},
): NoteSnapshot {
  return {
    path: `Work/Clients/${client}/Projects/${name}/${name}.md`,
    frontmatter: {
      type: "project",
      client: `[[${client}]]`,
      status: "active",
      priority: "high",
      start_date: "2026-09-15",
      current_focus: true,
      ...extra,
    },
  };
}

function taskNote(
  client: string,
  project: string,
  name: string,
  extra: Frontmatter = {},
): NoteSnapshot {
  return {
    path: `Work/Clients/${client}/Projects/${project}/Tasks/${name}.md`,
    frontmatter: {
      type: "task",
      project: `[[${project}]]`,
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

/** Resolves a link by note name, wherever the link is written. Fine unless two notes share a name. */
function resolveByName(notes: readonly NoteSnapshot[]): LinkResolver {
  return (linkPath) =>
    notes.find((note) => noteNameOf(note.path) === linkPath)?.path;
}

function build(notes: readonly NoteSnapshot[]) {
  return buildIndex(notes, resolveByName(notes));
}

const EMPTY = { items: [], skipped: [] };

describe("buildIndex: mapping", () => {
  it("returns empty results for no notes", () => {
    expect(build([])).toEqual({
      clients: EMPTY,
      projects: EMPTY,
      tasks: EMPTY,
    });
  });

  it("maps a client, a project and a task", () => {
    const index = build([
      clientNote("ABC Bank"),
      projectNote("ABC Bank", "MRI Reporting"),
      taskNote("ABC Bank", "MRI Reporting", "Fix mapping"),
    ]);

    expect(index.clients).toEqual({
      items: [{ path: BANK_PATH, name: "ABC Bank", status: "active" }],
      skipped: [],
    });
    expect(index.projects).toEqual({
      items: [
        {
          path: MRI_PATH,
          name: "MRI Reporting",
          client: { path: BANK_PATH, name: "ABC Bank" },
          status: "active",
          priority: "high",
          startDate: "2026-09-15",
          currentFocus: true,
        },
      ],
      skipped: [],
    });
    expect(index.tasks).toEqual({
      items: [
        {
          path: FIX_PATH,
          name: "Fix mapping",
          project: { path: MRI_PATH, name: "MRI Reporting" },
          status: "in-progress",
          priority: "high",
          due: "2026-10-06",
          estimatedMinutes: 120,
          created: "2026-10-04",
          completed: undefined,
          outcome: undefined,
        },
      ],
      skipped: [],
    });
  });

  it("resolves a link that has an alias", () => {
    const index = build([
      clientNote("ABC Bank"),
      projectNote("ABC Bank", "MRI Reporting", {
        client: "[[ABC Bank|the bank]]",
      }),
    ]);
    expect(index.projects.items.map((p) => p.client.path)).toEqual([BANK_PATH]);
  });

  it("ignores notes that are not ours, without listing them as skipped", () => {
    const notes: NoteSnapshot[] = [
      { path: "Plain.md", frontmatter: undefined },
      { path: "Empty.md", frontmatter: {} },
      { path: "Meeting.md", frontmatter: { type: "meeting" } },
      { path: "Number.md", frontmatter: { type: 5 } },
    ];
    expect(build(notes)).toEqual({
      clients: EMPTY,
      projects: EMPTY,
      tasks: EMPTY,
    });
  });
});

describe("buildIndex: validation failures", () => {
  it("skips a client with an invalid status", () => {
    const index = build([clientNote("ABC Bank", { status: "nope" })]);
    expect(index.clients.items).toEqual([]);
    expect(index.clients.skipped).toHaveLength(1);
    expect(index.clients.skipped[0]?.path).toBe(BANK_PATH);
    expect(index.clients.skipped[0]?.reason).toContain("status");
  });

  it("skips a project with an invalid priority", () => {
    const index = build([
      clientNote("ABC Bank"),
      projectNote("ABC Bank", "MRI Reporting", { priority: "urgent" }),
    ]);
    expect(index.projects.items).toEqual([]);
    expect(index.projects.skipped).toHaveLength(1);
    expect(index.projects.skipped[0]?.path).toBe(MRI_PATH);
    expect(index.projects.skipped[0]?.reason).toContain("priority");
  });

  it("skips a task with an invalid status", () => {
    const index = build([
      clientNote("ABC Bank"),
      projectNote("ABC Bank", "MRI Reporting"),
      taskNote("ABC Bank", "MRI Reporting", "Fix mapping", { status: "nope" }),
    ]);
    expect(index.tasks.items).toEqual([]);
    expect(index.tasks.skipped).toHaveLength(1);
    expect(index.tasks.skipped[0]?.path).toBe(FIX_PATH);
    expect(index.tasks.skipped[0]?.reason).toContain("status");
  });

  it("shows the bad value when a task's project link is not a link", () => {
    const index = build([
      clientNote("ABC Bank"),
      projectNote("ABC Bank", "MRI Reporting"),
      taskNote("ABC Bank", "MRI Reporting", "Fix mapping", {
        project: "not a link",
      }),
    ]);
    expect(index.tasks.skipped).toHaveLength(1);
    expect(index.tasks.skipped[0]?.reason).toContain("not a link");
  });
});

describe("buildIndex: link resolution", () => {
  it("skips a project whose client link does not resolve", () => {
    const index = build([projectNote("Ghost", "Lost")]);
    expect(index.projects.items).toEqual([]);
    expect(index.projects.skipped).toHaveLength(1);
    expect(index.projects.skipped[0]?.reason).toContain("does not resolve");
  });

  it("skips a project whose client link points at a note that is not a client", () => {
    const other = projectNote("ABC Bank", "Other", {
      client: "[[MRI Reporting]]",
    });
    const index = build([
      clientNote("ABC Bank"),
      projectNote("ABC Bank", "MRI Reporting"),
      other,
    ]);
    expect(index.projects.items.map((p) => p.name)).toEqual(["MRI Reporting"]);
    expect(index.projects.skipped).toHaveLength(1);
    expect(index.projects.skipped[0]?.path).toBe(other.path);
    expect(index.projects.skipped[0]?.reason).toContain("not a client note");
  });

  it("skips a project whose client link points at a note with no type", () => {
    const index = build([
      { path: "Plain.md", frontmatter: undefined },
      projectNote("ABC Bank", "MRI Reporting", { client: "[[Plain]]" }),
    ]);
    expect(index.projects.items).toEqual([]);
    expect(index.projects.skipped[0]?.reason).toContain("not a client note");
  });

  it("skips a task whose project link does not resolve", () => {
    const index = build([
      clientNote("ABC Bank"),
      taskNote("ABC Bank", "Ghost project", "Fix mapping"),
    ]);
    expect(index.tasks.items).toEqual([]);
    expect(index.tasks.skipped).toHaveLength(1);
    expect(index.tasks.skipped[0]?.reason).toContain("does not resolve");
  });

  it("skips a task whose project link points at a note that is not a project", () => {
    const index = build([
      clientNote("ABC Bank"),
      taskNote("ABC Bank", "ABC Bank", "Fix mapping"),
    ]);
    expect(index.tasks.items).toEqual([]);
    expect(index.tasks.skipped).toHaveLength(1);
    expect(index.tasks.skipped[0]?.reason).toContain("not a project note");
  });

  it("keeps a task when its project note is itself invalid (decision M4-9)", () => {
    const index = build([
      clientNote("ABC Bank"),
      projectNote("ABC Bank", "MRI Reporting", { priority: "urgent" }),
      taskNote("ABC Bank", "MRI Reporting", "Fix mapping"),
    ]);
    expect(index.projects.items).toEqual([]);
    expect(index.projects.skipped).toHaveLength(1);
    expect(index.tasks.items.map((t) => t.project)).toEqual([
      { path: MRI_PATH, name: "MRI Reporting" },
    ]);
  });

  it("keeps a project when its client note is itself invalid (decision M4-9)", () => {
    const index = build([
      clientNote("ABC Bank", { status: "nope" }),
      projectNote("ABC Bank", "MRI Reporting"),
    ]);
    expect(index.clients.items).toEqual([]);
    expect(index.clients.skipped).toHaveLength(1);
    expect(index.projects.items.map((p) => p.client)).toEqual([
      { path: BANK_PATH, name: "ABC Bank" },
    ]);
  });

  it("passes the path of the note that contains the link to the resolver", () => {
    const notes = [
      clientNote("ABC Bank"),
      projectNote("ABC Bank", "MRI Reporting"),
      taskNote("ABC Bank", "MRI Reporting", "Fix mapping"),
    ];
    const calls: Array<[string, string]> = [];
    const resolver: LinkResolver = (linkPath, sourcePath) => {
      calls.push([linkPath, sourcePath]);
      return notes.find((note) => noteNameOf(note.path) === linkPath)?.path;
    };

    buildIndex(notes, resolver);

    expect(calls).toContainEqual(["ABC Bank", MRI_PATH]);
    expect(calls).toContainEqual(["MRI Reporting", FIX_PATH]);
  });

  it("lets the resolver pick between two clients that share a name", () => {
    const first = clientNote("ABC Bank");
    const second: NoteSnapshot = {
      path: "Work/Clients/Other/ABC Bank.md",
      frontmatter: { type: "client", status: "active" },
    };
    const inFirst = projectNote("ABC Bank", "Reporting");
    const inSecond: NoteSnapshot = {
      path: "Work/Clients/Other/Projects/Reporting/Reporting.md",
      frontmatter: { ...inFirst.frontmatter },
    };
    const resolver: LinkResolver = (linkPath, sourcePath) => {
      if (linkPath !== "ABC Bank") return undefined;
      return sourcePath.startsWith("Work/Clients/Other/")
        ? second.path
        : first.path;
    };

    const index = buildIndex([first, second, inFirst, inSecond], resolver);

    const byProject = index.projects.items.map((p) => [p.path, p.client.path]);
    expect(byProject).toEqual([
      [inFirst.path, first.path],
      [inSecond.path, second.path],
    ]);
  });
});

describe("buildIndex: determinism", () => {
  it("orders items by path whatever the input order", () => {
    const index = build([
      clientNote("Charlie"),
      clientNote("Alpha"),
      clientNote("Bravo"),
    ]);
    expect(index.clients.items.map((c) => c.name)).toEqual([
      "Alpha",
      "Bravo",
      "Charlie",
    ]);
  });

  it("orders skipped notes by path whatever the input order", () => {
    const index = build([
      clientNote("Charlie", { status: "nope" }),
      clientNote("Alpha", { status: "nope" }),
      clientNote("Bravo", { status: "nope" }),
    ]);
    expect(index.clients.skipped.map((s) => noteNameOf(s.path))).toEqual([
      "Alpha",
      "Bravo",
      "Charlie",
    ]);
  });

  it("does not modify its input", () => {
    const notes = [clientNote("Charlie"), clientNote("Alpha")];
    Object.freeze(notes);
    for (const note of notes) Object.freeze(note);
    expect(() => build(notes)).not.toThrow();
  });

  it("gives equal results when called twice with the same input", () => {
    const notes = [
      clientNote("ABC Bank"),
      projectNote("ABC Bank", "MRI Reporting"),
      taskNote("ABC Bank", "MRI Reporting", "Fix mapping"),
    ];
    expect(build(notes)).toEqual(build(notes));
  });
});