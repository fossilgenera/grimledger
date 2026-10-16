import { describe, expect, it } from "vitest";
import { projectMutableToFrontmatter } from "../../../src/data/mapping/projectMapper";

describe("projectMutableToFrontmatter", () => {
  it("writes the three mutable fields", () => {
    expect(
      projectMutableToFrontmatter({
        status: "active",
        priority: "high",
        currentFocus: true,
      }),
    ).toEqual({ status: "active", priority: "high", current_focus: true });
  });

  it("writes false explicitly rather than leaving the key out", () => {
    const result = projectMutableToFrontmatter({
      status: "paused",
      priority: "low",
      currentFocus: false,
    });
    expect(result["current_focus"]).toBe(false);
  });

  it("never writes type, client or start_date", () => {
    const keys = Object.keys(
      projectMutableToFrontmatter({
        status: "active",
        priority: "medium",
        currentFocus: false,
      }),
    );
    expect(keys.sort()).toEqual(["current_focus", "priority", "status"]);
  });
});