import { describe, expect, it } from "vitest";
import { workSessionMutableToFrontmatter } from "../../../src/data/mapping/workSessionMapper";

describe("workSessionMutableToFrontmatter", () => {
  it("writes only minutes and note", () => {
    const written = workSessionMutableToFrontmatter({ minutes: 90, note: "Traced it" });
    expect(Object.keys(written).sort()).toEqual(["minutes", "note"]);
    expect(written).toEqual({ minutes: 90, note: "Traced it" });
  });

  it("writes null for an absent note", () => {
    expect(workSessionMutableToFrontmatter({ minutes: 30, note: undefined })).toEqual({
      minutes: 30,
      note: null,
    });
  });
});