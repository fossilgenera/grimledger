import { describe, expect, it } from "vitest";
import { clientFromFrontMatter, clientToFrontMatter} from "../../../src/data/mapping/clientMapper";

const PATH = "Work/Clients/ABC Bank/ABC Bank.md";

describe("clientFromFrontMatter", () => {
  it("maps a valid client and takes the name from the path", () => {
    const result = clientFromFrontMatter(PATH, { type: "client", status: "active" });
    expect(result).toEqual({
      ok: true,
      value: { path: PATH, name: "ABC Bank", status: "active" },
    });
  });

  it("fails when frontmatter is missing", () => {
    expect(clientFromFrontMatter(PATH, undefined).ok).toBe(false);
  });

  it("fails when type is not client", () => {
    expect(clientFromFrontMatter(PATH, { type: "project", status: "active" }).ok).toBe(false);
  });

  it("fails on an invalid status and names the value", () => {
    const result = clientFromFrontMatter(PATH, { type: "client", status: "finished" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("finished");
    }
  });

  it("fails when status is missing", () => {
    expect(clientFromFrontMatter(PATH, { type: "client" }).ok).toBe(false);
  });

  it("ignores unrelated properties", () => {
    const result = clientFromFrontMatter(PATH, {
      type: "client",
      status: "archived",
      my_custom_field: 42,
    });
    expect(result.ok).toBe(true);
  });
});

describe("clientToFrontMatter", () => {
  it("writes only the owned properties", () => {
    expect(clientToFrontMatter({ status: "inactive" })).toEqual({
      type: "client",
      status: "inactive",
    });
  });
});