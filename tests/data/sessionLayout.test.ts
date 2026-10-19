import { describe, expect, it } from "vitest";
import { sessionFolderPath, sessionNotePath } from "../../src/data/VaultLayout";

const PROJECT_NOTE =
  "Work/Clients/ABC Bank/Projects/MRI Reporting/MRI Reporting.md";

describe("session paths", () => {
  it("puts the folder beside the project note", () => {
    expect(sessionFolderPath(PROJECT_NOTE)).toBe(
      "Work/Clients/ABC Bank/Projects/MRI Reporting/Work Sessions",
    );
  });

  it("builds the note path from the session name", () => {
    expect(sessionNotePath(PROJECT_NOTE, "2026-10-04 Fix mapping")).toBe(
      "Work/Clients/ABC Bank/Projects/MRI Reporting/Work Sessions/2026-10-04 Fix mapping.md",
    );
  });

  it("throws when the project note is not inside a folder", () => {
    expect(() => sessionFolderPath("Loose.md")).toThrow();
  });

  it("throws on an invalid session name", () => {
    expect(() => sessionNotePath(PROJECT_NOTE, "a/b")).toThrow();
  });
});