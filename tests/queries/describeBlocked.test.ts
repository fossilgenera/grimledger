import { describe, expect, it } from "vitest";
import { describeBlocked } from "../../src/ui/views/describeBlocked";
import { makeTask } from "./builders";

const TODAY = "2026-10-05";

function blocked(overrides: Record<string, unknown> = {}) {
  return makeTask("Fix mapping", { status: "blocked", ...overrides });
}

describe("describeBlocked", () => {
  it("gives the reason, how long, and when it is expected", () => {
    const task = blocked({
      waitingOn: "Production credentials",
      blockedBy: "Client",
      blockedSince: "2026-10-03",
      expectedResolution: "2026-10-12",
    });
    expect(describeBlocked(task, TODAY)).toEqual([
      "Waiting on Production credentials (Client)",
      "Blocked for 2 days",
      "Expected: 2026-10-12",
    ]);
  });

  it("leaves out who when blockedBy is missing", () => {
    const task = blocked({
      waitingOn: "Credentials",
      blockedSince: "2026-10-04",
    });
    expect(describeBlocked(task, TODAY)).toEqual([
      "Waiting on Credentials",
      "Blocked for 1 day",
    ]);
  });

  it("uses blockedBy alone when there is nothing waited on", () => {
    expect(describeBlocked(blocked({ blockedBy: "Client" }), TODAY)).toEqual([
      "Blocked by Client",
    ]);
  });

  it("says no reason was given for a task blocked by hand", () => {
    expect(describeBlocked(blocked(), TODAY)).toEqual(["No reason given"]);
  });

  it("says blocked today for a block that started today", () => {
    const task = blocked({ waitingOn: "Credentials", blockedSince: TODAY });
    expect(describeBlocked(task, TODAY)[1]).toBe("Blocked today");
  });

  it("never shows a negative duration", () => {
    const task = blocked({
      waitingOn: "Credentials",
      blockedSince: "2026-10-09",
    });
    expect(describeBlocked(task, TODAY)[1]).toBe("Blocked today");
  });

  it("describes the expected date relative to today", () => {
    const tomorrow = blocked({ expectedResolution: "2026-10-06" });
    const late = blocked({ expectedResolution: "2026-10-04" });
    expect(describeBlocked(tomorrow, TODAY)).toContain("Expected: Tomorrow");
    expect(describeBlocked(late, TODAY)).toContain("Expected: 1 day overdue");
  });
});
