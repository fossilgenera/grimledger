import { describe, expect, it } from "vitest";
import { dailyFolderPath, dailyNotePath } from "../../src/data/VaultLayout";

describe("daily note paths", () => {
  it("groups daily notes into a folder per year", () => {
    expect(dailyFolderPath("2026-10-27")).toBe("Work/Daily/2026");
    expect(dailyFolderPath("2027-01-02")).toBe("Work/Daily/2027");
  });

  it("names the note after the date", () => {
    expect(dailyNotePath("2026-10-27")).toBe("Work/Daily/2026/2026-10-27.md");
  });

  it.each(["2026-02-30", "tomorrow", "", "2026-1-5"])(
    "throws for the invalid date %j",
    (date) => {
      expect(() => dailyFolderPath(date)).toThrow();
      expect(() => dailyNotePath(date)).toThrow();
    },
  );
});