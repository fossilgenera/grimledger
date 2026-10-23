import { describe, expect, it } from "vitest";
import type { Task } from "../../../src/domain/models/task";
import type { Result } from "../../../src/domain/result";
import {
  blockTask,
  closedBlocker,
  type BlockDetails,
} from "../../../src/domain/rules/blocking";
import { makeTask } from "../../queries/builders";

const TODAY = "2026-10-05";

const DETAILS: BlockDetails = {
  waitingOn: "Production credentials",
  blockedBy: "Client",
  since: "2026-10-04",
  expectedResolution: "2026-10-07",
};

function expectOk(result: Result<Task>): Task {
  if (!result.ok) {
    throw new Error(`Expected success but got failure: ${result.reason}`);
  }
  return result.value;
}

function reasonOf(result: Result<Task>): string {
  if (result.ok) {
    throw new Error("Expected a failure but got success");
  }
  return result.reason;
}

describe("blockTask", () => {
  it("blocks an in-progress task and records the details", () => {
    const task = makeTask("Fix mapping", { status: "in-progress" });
    const blocked = expectOk(blockTask(task, DETAILS, TODAY));
    expect(blocked.status).toBe("blocked");
    expect(blocked.blockedSince).toBe("2026-10-04");
    expect(blocked.blockedBy).toBe("Client");
    expect(blocked.waitingOn).toBe("Production credentials");
    expect(blocked.expectedResolution).toBe("2026-10-07");
  });

  it("blocks a not-started task", () => {
    const task = makeTask("Fix mapping", { status: "not-started" });
    expect(expectOk(blockTask(task, DETAILS, TODAY)).status).toBe("blocked");
  });

  it("trims text and treats an empty blockedBy as absent", () => {
    const task = makeTask("Fix mapping", { status: "in-progress" });
    const blocked = expectOk(
      blockTask(
        task,
        { waitingOn: "  Credentials  ", blockedBy: "   ", since: TODAY },
        TODAY,
      ),
    );
    expect(blocked.waitingOn).toBe("Credentials");
    expect(blocked.blockedBy).toBeUndefined();
    expect(blocked.expectedResolution).toBeUndefined();
  });

  it("requires waitingOn", () => {
    const task = makeTask("Fix mapping", { status: "in-progress" });
    expect(
      reasonOf(blockTask(task, { ...DETAILS, waitingOn: "" }, TODAY)),
    ).toContain("waiting");
    expect(
      reasonOf(blockTask(task, { ...DETAILS, waitingOn: "   " }, TODAY)),
    ).toContain("waiting");
  });

  it("rejects a blocked since date in the future", () => {
    const task = makeTask("Fix mapping", { status: "in-progress" });
    expect(
      reasonOf(blockTask(task, { ...DETAILS, since: "2026-10-06" }, TODAY)),
    ).toContain("future");
  });

  it("accepts a blocked since date of today or earlier", () => {
    const task = makeTask("Fix mapping", { status: "in-progress" });
    expectOk(
      blockTask(
        task,
        { ...DETAILS, since: TODAY, expectedResolution: undefined },
        TODAY,
      ),
    );
    expectOk(blockTask(task, { ...DETAILS, since: "2026-01-01" }, TODAY));
  });

  it("rejects an expected resolution before the blocked since date", () => {
    const task = makeTask("Fix mapping", { status: "in-progress" });
    expect(
      reasonOf(
        blockTask(
          task,
          { ...DETAILS, expectedResolution: "2026-10-03" },
          TODAY,
        ),
      ),
    ).toContain("Expected resolution");
  });

  it("accepts an expected resolution equal to the since date", () => {
    const task = makeTask("Fix mapping", { status: "in-progress" });
    expectOk(
      blockTask(task, { ...DETAILS, expectedResolution: DETAILS.since }, TODAY),
    );
  });

  it("refuses a complete task", () => {
    const task = makeTask("Fix mapping", {
      status: "complete",
      completed: "2026-10-01",
    });
    const reason = reasonOf(blockTask(task, DETAILS, TODAY));
    expect(reason).toContain("complete");
    expect(reason).toContain("blocked");
  });

  it("refuses a task that is already blocked", () => {
    const task = makeTask("Fix mapping", { status: "blocked" });
    expect(reasonOf(blockTask(task, DETAILS, TODAY))).toContain("blocked");
  });

  it("does not mutate the input and keeps every other field", () => {
    const task = Object.freeze(
      makeTask("Fix mapping", {
        status: "in-progress",
        due: "2026-10-09",
        priority: "high",
      }),
    );
    const blocked = expectOk(blockTask(task, DETAILS, TODAY));
    expect(task.status).toBe("in-progress");
    expect(task.blockedSince).toBeUndefined();
    expect(blocked.due).toBe("2026-10-09");
    expect(blocked.priority).toBe("high");
    expect(blocked.completed).toBeUndefined();
  });
});

describe("closedBlocker", () => {
  const blockedTask = makeTask("Fix mapping", {
    status: "blocked",
    blockedSince: "2026-10-01",
    blockedBy: "Client",
    waitingOn: "Credentials",
  });

  it("describes the block that is ending", () => {
    expect(closedBlocker(blockedTask, "2026-10-05")).toEqual({
      since: "2026-10-01",
      until: "2026-10-05",
      blockedBy: "Client",
      waitingOn: "Credentials",
    });
  });

  it("allows a block that starts and ends on the same day", () => {
    expect(closedBlocker(blockedTask, "2026-10-01")).toBeDefined();
  });

  it("returns undefined for a task that is not blocked", () => {
    const task = makeTask("Fix mapping", {
      status: "in-progress",
      blockedSince: "2026-10-01",
    });
    expect(closedBlocker(task, "2026-10-05")).toBeUndefined();
  });

  it("returns undefined when there is no blocked since date", () => {
    const task = makeTask("Fix mapping", { status: "blocked" });
    expect(closedBlocker(task, "2026-10-05")).toBeUndefined();
  });

  it("returns undefined when the block would start after it ends", () => {
    expect(closedBlocker(blockedTask, "2026-09-30")).toBeUndefined();
  });
});
