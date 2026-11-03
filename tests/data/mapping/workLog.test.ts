import { describe, expect, it } from "vitest";
import { parseWorkLog } from "../../../src/data/mapping/workLog";
import { dailyNoteBody } from "../../../src/domain/rules/dailyNoteTemplate";

function note(...lines: string[]): string {
  return lines.join("\n");
}

describe("parseWorkLog: entries", () => {
  it("reads a task heading with a time", () => {
    const log = parseWorkLog(
      note(
        "# Day",
        "",
        "## Work log",
        "### [[Fix mapping]] 1h 30m",
        "Did stuff",
      ),
    );
    expect(log.hasSection).toBe(true);
    expect(log.problems).toEqual([]);
    expect(log.entries).toEqual([
      { taskLinkPath: "Fix mapping", minutes: 90, line: 4 },
    ]);
  });

  it("reads bare minutes, hours and minutes", () => {
    const log = parseWorkLog(
      note("## Work log", "### [[A]] 90", "### [[B]] 2h", "### [[C]] 45m"),
    );
    expect(log.entries.map((entry) => entry.minutes)).toEqual([90, 120, 45]);
  });

  it("keeps a heading that has a link but no time", () => {
    const log = parseWorkLog(note("## Work log", "### [[A]]"));
    expect(log.entries).toEqual([
      { taskLinkPath: "A", minutes: undefined, line: 2 },
    ]);
    expect(log.problems).toEqual([]);
  });

  it("allows a separator between the link and the time", () => {
    const log = parseWorkLog(
      note(
        "## Work log",
        "### [[A]] - 1h",
        "### [[B]] \u2014 45m",
        "### [[C]]: 2h",
        "### [[D]] \u2013 30m",
        "### [[E]] | 15m",
      ),
    );
    expect(log.entries.map((entry) => entry.minutes)).toEqual([
      60, 45, 120, 30, 15,
    ]);
  });

  it("uses the target of a link with an alias or a heading", () => {
    const log = parseWorkLog(
      note(
        "## Work log",
        "### [[Fix mapping|the fix]] 1h",
        "### [[Fix mapping#Log]] 2h",
      ),
    );
    expect(log.entries.map((entry) => entry.taskLinkPath)).toEqual([
      "Fix mapping",
      "Fix mapping",
    ]);
  });

  it("reports line numbers counted from 1, including the properties block", () => {
    const log = parseWorkLog(
      note(
        "---",
        "type: daily_note",
        "date: 2026-10-27",
        "---",
        "# Day",
        "## Work log",
        "### [[A]] 1h",
      ),
    );
    expect(log.entries[0]?.line).toBe(7);
  });

  it("handles Windows line endings", () => {
    const log = parseWorkLog(
      ["## Work log", "### [[A]] 1h", "text"].join("\r\n"),
    );
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0]?.minutes).toBe(60);
  });
});

describe("parseWorkLog: what is ignored", () => {
  it("ignores a heading with no link at all", () => {
    const log = parseWorkLog(note("## Work log", "### Lunch"));
    expect(log.entries).toEqual([]);
    expect(log.problems).toEqual([]);
  });

  it("ignores deeper headings", () => {
    const log = parseWorkLog(note("## Work log", "#### [[A]] 1h"));
    expect(log.entries).toEqual([]);
  });

  it("only reads the Work log section", () => {
    const log = parseWorkLog(
      note(
        "## Plan",
        "### [[Before]] 1h",
        "## Work log",
        "### [[Inside]] 1h",
        "## Learned",
        "### [[After]] 1h",
      ),
    );
    expect(log.entries.map((entry) => entry.taskLinkPath)).toEqual(["Inside"]);
  });

  it("ignores headings inside a code block", () => {
    const log = parseWorkLog(
      note("## Work log", "```", "### [[A]] 1h", "```", "### [[B]] 1h"),
    );
    expect(log.entries.map((entry) => entry.taskLinkPath)).toEqual(["B"]);
  });

  it("matches the section title ignoring letter case", () => {
    const log = parseWorkLog(note("## work LOG", "### [[A]] 1h"));
    expect(log.hasSection).toBe(true);
    expect(log.entries).toHaveLength(1);
  });

  it("reports no section when there is none", () => {
    const log = parseWorkLog(note("# Day", "## Plan"));
    expect(log.hasSection).toBe(false);
    expect(log.entries).toEqual([]);
  });

  it("finds nothing in a fresh daily note", () => {
    const log = parseWorkLog(dailyNoteBody("2026-10-27"));
    expect(log.hasSection).toBe(true);
    expect(log.entries).toEqual([]);
    expect(log.problems).toEqual([]);
  });
});

describe("parseWorkLog: problems", () => {
  it("reports a heading where the link does not come first", () => {
    const log = parseWorkLog(note("## Work log", "### Worked on [[A]] 1h"));
    expect(log.entries).toEqual([]);
    expect(log.problems).toHaveLength(1);
    expect(log.problems[0]?.line).toBe(2);
    expect(log.problems[0]?.reason).toContain("Start the heading");
  });

  it("reports a time that cannot be read", () => {
    const log = parseWorkLog(note("## Work log", "### [[A]] soon"));
    expect(log.entries).toEqual([]);
    expect(log.problems).toHaveLength(1);
    expect(log.problems[0]?.reason).toContain("time");
  });

  it("reports a link with nothing in it", () => {
    const log = parseWorkLog(note("## Work log", "### [[]] 1h"));
    expect(log.entries).toEqual([]);
    expect(log.problems).toHaveLength(1);
  });

  it("keeps reading after a problem", () => {
    const log = parseWorkLog(
      note("## Work log", "### [[A]] soon", "### [[B]] 1h"),
    );
    expect(log.entries.map((entry) => entry.taskLinkPath)).toEqual(["B"]);
    expect(log.problems).toHaveLength(1);
  });
});
