import { describe, expect, it } from "vitest";
import {
  copyListResult,
  type ListResult,
} from "../../../src/data/repositories/ListResult";

function sample(): ListResult<string> {
  return {
    items: ["a", "b"],
    skipped: [{ path: "x.md", reason: "bad" }],
  };
}

describe("copyListResult", () => {
  it("has the same content as the original", () => {
    const original = sample();
    expect(copyListResult(original)).toEqual(original);
  });

  it("returns new arrays, so changing the copy leaves the original alone", () => {
    const original = sample();
    const copy = copyListResult(original);

    copy.items.push("c");
    copy.skipped.pop();

    expect(original).toEqual(sample());
  });

  it("is a shallow copy: the item objects themselves are shared", () => {
    const original = sample();
    const copy = copyListResult(original);

    expect(copy.skipped[0]).toBe(original.skipped[0]);
  });
});