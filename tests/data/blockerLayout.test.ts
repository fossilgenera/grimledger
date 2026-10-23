import { describe, expect, it } from "vitest";
import { blockerFolderPath, blockerNotePath } from "../../src/data/VaultLayout";

const PROJECT = "Work/Clients/ABC Bank/Projects/MRI Reporting/MRI Reporting.md";

describe("blocker paths", () => {
  it("puts blockers in a Blockers folder inside the project folder", () => {
    expect(blockerFolderPath(PROJECT)).toBe(
      "Work/Clients/ABC Bank/Projects/MRI Reporting/Blockers",
    );
  });

  it("builds the note path from the name", () => {
    expect(blockerNotePath(PROJECT, "2026-10-04 Fix mapping")).toBe(
      "Work/Clients/ABC Bank/Projects/MRI Reporting/Blockers/2026-10-04 Fix mapping.md",
    );
  });

  it("derives the folder from the project note's real location", () => {
    expect(blockerFolderPath("Work/Clients/X/Projects/Renamed/Whatever.md")).toBe(
      "Work/Clients/X/Projects/Renamed/Blockers",
    );
  });

  it("throws for a project note that is not inside a folder", () => {
    expect(() => blockerFolderPath("Loose.md")).toThrow();
  });

  it("throws for an invalid name", () => {
    expect(() => blockerNotePath(PROJECT, "bad/name")).toThrow();
  });
});