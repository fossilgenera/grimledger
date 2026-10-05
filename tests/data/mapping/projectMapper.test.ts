import { describe, expect, it } from "vitest";
import {
  projectFromFrontmatter,
  projectToFrontmatter,
} from "../../../src/data/mapping/projectMapper";

const PATH = "Work/Clients/ABC Bank/Projects/MRI Reporting/MRI Reporting.md";

const VALID = {
  type: "project",
  client: "[[ABC Bank]]",
  status: "active",
  priority: "high",
  start_date: "2026-09-15",
  current_focus: true,
};

describe("projectFromFrontmatter", () => {
  it("maps a valid project", () => {
    expect(projectFromFrontmatter(PATH, VALID)).toEqual({
      ok: true,
      value: {
        path: PATH,
        name: "MRI Reporting",
        clientLinkPath: "ABC Bank",
        status: "active",
        priority: "high",
        startDate: "2026-09-15",
        currentFocus: true,
      },
    });
  });

  it("extracts the target from an aliased client link", () => {
    const result = projectFromFrontmatter(PATH, { ...VALID, client: "[[Folder/ABC Bank|bank]]" });
    expect(result.ok && result.value.clientLinkPath).toBe("Folder/ABC Bank");
  });

  it("defaults current_focus to false when missing", () => {
    const { current_focus: _omitted, ...withoutFocus } = VALID;
    const result = projectFromFrontmatter(PATH, withoutFocus);
    expect(result.ok && result.value.currentFocus).toBe(false);
  });

  it("treats a missing or empty start_date as undefined", () => {
    const { start_date: _omitted, ...withoutDate } = VALID;
    const missing = projectFromFrontmatter(PATH, withoutDate);
    const empty = projectFromFrontmatter(PATH, { ...VALID, start_date: null });
    expect(missing.ok && missing.value.startDate).toBeUndefined();
    expect(empty.ok && empty.value.startDate).toBeUndefined();
  });

  it("fails when frontmatter is missing", () => {
    expect(projectFromFrontmatter(PATH, undefined).ok).toBe(false);
  });

  it("fails when type is not project", () => {
    expect(projectFromFrontmatter(PATH, { ...VALID, type: "client" }).ok).toBe(false);
  });

  it.each([
    ["client is not a wikilink", { client: "ABC Bank" }],
    ["client is missing", { client: undefined }],
    ["status is invalid", { status: "finished" }],
    ["priority is invalid", { priority: "urgent" }],
    ["priority is missing", { priority: undefined }],
    ["start_date is not a date", { start_date: "soon" }],
    ["start_date is not a real date", { start_date: "2026-02-30" }],
    ["current_focus is not a boolean", { current_focus: "yes" }],
  ])("fails when %s", (_label, override) => {
    expect(projectFromFrontmatter(PATH, { ...VALID, ...override }).ok).toBe(false);
  });
});

describe("projectToFrontmatter", () => {
  it("writes the owned properties", () => {
    expect(
      projectToFrontmatter({
        clientLink: "[[ABC Bank]]",
        status: "active",
        priority: "medium",
        startDate: "2026-09-15",
        currentFocus: false,
      }),
    ).toEqual({
      type: "project",
      client: "[[ABC Bank]]",
      status: "active",
      priority: "medium",
      current_focus: false,
      start_date: "2026-09-15",
    });
  });

  it("omits start_date when there is no value", () => {
    const result = projectToFrontmatter({
      clientLink: "[[ABC Bank]]",
      status: "active",
      priority: "medium",
      startDate: undefined,
      currentFocus: false,
    });
    expect("start_date" in result).toBe(false);
  });

  it("round-trips through the reader", () => {
    const written = projectToFrontmatter({
      clientLink: "[[ABC Bank]]",
      status: "paused",
      priority: "low",
      startDate: "2026-01-02",
      currentFocus: true,
    });
    const read = projectFromFrontmatter(PATH, written);
    expect(read.ok && read.value.status).toBe("paused");
    expect(read.ok && read.value.clientLinkPath).toBe("ABC Bank");
  });
});