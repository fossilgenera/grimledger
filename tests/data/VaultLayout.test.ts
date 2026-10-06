import { describe, expect, it } from "vitest";
import {
  clientFolderPath,
  clientNotePath,
  folderOf,
  projectFolderPath,
  projectNotePath,
  validateEntityName,
  taskFolderPath,
  taskNotePath,
} from "../../src/data/VaultLayout";

describe("validateEntityName", () => {
  it("accepts a normal name", () => {
    expect(validateEntityName("ABC Bank")).toBeUndefined();
  });

  it("rejects an empty string", () => {
    expect(validateEntityName("")).toBeDefined();
  });

  it("rejects whitespace only", () => {
    expect(validateEntityName("   ")).toBeDefined();
  });

  it.each(["Q3: Report", "a/b", "What?", "Notes #1", "[draft]"])(
    "rejects a forbidden character in %s",
    (name) => {
      expect(validateEntityName(name)).toBeDefined();
    },
  );

  it("rejects a trailing dot", () => {
    expect(validateEntityName("Report.")).toBeDefined();
  });

  it("rejects a leading dot", () => {
    expect(validateEntityName(".hidden")).toBeDefined();
  });

  it("ignores surrounding whitespace", () => {
    expect(validateEntityName("  ABC Bank  ")).toBeUndefined();
  });
});

describe("folderOf", () => {
  it("returns everything before the last slash", () => {
    expect(folderOf("Work/Clients/ABC Bank/ABC Bank.md")).toBe(
      "Work/Clients/ABC Bank",
    );
  });

  it("returns an empty string when there is no slash", () => {
    expect(folderOf("note.md")).toBe("");
  });
});

describe("path functions", () => {
  it("builds the client folder path", () => {
    expect(clientFolderPath("ABC Bank")).toBe("Work/Clients/ABC Bank");
  });

  it("builds the client note path", () => {
    expect(clientNotePath("ABC Bank")).toBe(
      "Work/Clients/ABC Bank/ABC Bank.md",
    );
  });

  it("builds the project folder path", () => {
    expect(
      projectFolderPath("Work/Clients/ABC Bank/ABC Bank.md", "MRI Reporting"),
    ).toBe("Work/Clients/ABC Bank/Projects/MRI Reporting");
  });

  it("builds the project note path", () => {
    expect(
      projectNotePath("Work/Clients/ABC Bank/ABC Bank.md", "MRI Reporting"),
    ).toBe("Work/Clients/ABC Bank/Projects/MRI Reporting/MRI Reporting.md");
  });

  it("derives the project path from the client note location, not the client name", () => {
    const result = projectFolderPath(
      "Elsewhere/ABC Bank/ABC Bank.md",
      "MRI Reporting",
    );
    expect(result.startsWith("Elsewhere/ABC Bank/Projects/")).toBe(true);
  });

  it("trims names before building paths", () => {
    expect(clientFolderPath("  ABC Bank  ")).toBe("Work/Clients/ABC Bank");
  });

  it("throws on an invalid name", () => {
    expect(() => clientFolderPath("a/b")).toThrow();
    expect(() => projectNotePath("Work/Clients/X/X.md", "")).toThrow();
  });

  it("throws when the client note path is not inside a folder", () => {
    expect(() => projectFolderPath("ABC Bank", "MRI Reporting")).toThrow();
    expect(() => projectNotePath("ABC Bank.md", "MRI Reporting")).toThrow();
  });
});

describe("task paths", () => {
  const projectNote =
    "Work/Clients/ABC Bank/Projects/MRI Reporting/MRI Reporting.md";

  it("puts the Tasks folder beside the project note", () => {
    expect(taskFolderPath(projectNote)).toBe(
      "Work/Clients/ABC Bank/Projects/MRI Reporting/Tasks",
    );
  });

  it("builds the task note path inside the Tasks folder", () => {
    expect(taskNotePath(projectNote, "Fix mapping")).toBe(
      "Work/Clients/ABC Bank/Projects/MRI Reporting/Tasks/Fix mapping.md",
    );
  });

  it("trims the task name", () => {
    expect(taskNotePath(projectNote, "  Fix mapping  ")).toBe(
      "Work/Clients/ABC Bank/Projects/MRI Reporting/Tasks/Fix mapping.md",
    );
  });

  it("derives the folder from the note path, not the project name", () => {
    expect(taskFolderPath("Work/Clients/Moved/Projects/Renamed/Whatever.md")).toBe(
      "Work/Clients/Moved/Projects/Renamed/Tasks",
    );
  });

  it("throws on an invalid task name", () => {
    expect(() => taskNotePath(projectNote, "bad/name")).toThrow();
    expect(() => taskNotePath(projectNote, "   ")).toThrow();
  });

  it("throws when the project note is not inside a folder", () => {
    expect(() => taskFolderPath("Orphan.md")).toThrow();
    expect(() => taskNotePath("Orphan.md", "Task")).toThrow();
  });
});