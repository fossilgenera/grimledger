import { describe, expect, it } from "vitest";
import {
  buildIndex,
  type LinkResolver,
  type NoteSnapshot,
} from "../../../src/data/index/buildIndex";

const resolve: LinkResolver = () => undefined;

function note(path: string, frontmatter: Record<string, unknown>): NoteSnapshot {
  return { path, frontmatter };
}

describe("buildIndex: daily notes", () => {
  it("maps a daily note", () => {
    const index = buildIndex(
      [note("Work/Daily/2026/2026-10-27.md", { type: "daily_note", date: "2026-10-27" })],
      resolve,
    );
    expect(index.dailyNotes.skipped).toEqual([]);
    expect(index.dailyNotes.items).toEqual([
      { path: "Work/Daily/2026/2026-10-27.md", name: "2026-10-27", date: "2026-10-27" },
    ]);
  });

  it("skips a daily note with no date and says why", () => {
    const index = buildIndex(
      [note("Work/Daily/2026/2026-10-27.md", { type: "daily_note" })],
      resolve,
    );
    expect(index.dailyNotes.items).toHaveLength(0);
    expect(index.dailyNotes.skipped).toHaveLength(1);
    expect(index.dailyNotes.skipped[0]?.reason).toContain("date");
  });

  it("ignores notes of other types", () => {
    const index = buildIndex([note("Other.md", { type: "note" })], resolve);
    expect(index.dailyNotes.items).toEqual([]);
    expect(index.dailyNotes.skipped).toEqual([]);
  });

  it("lists daily notes sorted by path", () => {
    const index = buildIndex(
      [
        note("Work/Daily/2026/2026-10-28.md", { type: "daily_note", date: "2026-10-28" }),
        note("Work/Daily/2026/2026-10-27.md", { type: "daily_note", date: "2026-10-27" }),
      ],
      resolve,
    );
    expect(index.dailyNotes.items.map((item) => item.date)).toEqual([
      "2026-10-27",
      "2026-10-28",
    ]);
  });
});