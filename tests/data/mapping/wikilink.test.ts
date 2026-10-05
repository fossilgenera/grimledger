import { describe, expect, it } from "vitest";
import { parseWikilinkTarget } from "../../../src/data/mapping/wikilink";

describe("parseWikilinkTarget", () => {
  it("parses a plain wikilink", () => {
    expect(parseWikilinkTarget("[[ABC Bank]]")).toBe("ABC Bank");
  });

  it("drops an alias", () => {
    expect(parseWikilinkTarget("[[Folder/ABC Bank|the bank]]")).toBe("Folder/ABC Bank");
  });

  it("drops a heading", () => {
    expect(parseWikilinkTarget("[[ABC Bank#Notes]]")).toBe("ABC Bank");
  });

  it("ignores surrounding whitespace", () => {
    expect(parseWikilinkTarget("  [[ABC Bank]]  ")).toBe("ABC Bank");
  });

  it.each(["ABC Bank", "[ABC Bank]", "[[ABC Bank]", "[[]]", "[[#Heading]]", "[[|alias]]"])(
    "returns undefined for %s",
    (value) => {
      expect(parseWikilinkTarget(value)).toBeUndefined();
    },
  );

  it.each([undefined, null, 5, true, {}, ["[[ABC Bank]]"]])(
    "returns undefined for non-string value %j",
    (value) => {
      expect(parseWikilinkTarget(value)).toBeUndefined();
    },
  );
});