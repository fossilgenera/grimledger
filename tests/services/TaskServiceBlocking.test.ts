import { beforeEach, describe, expect, it } from "vitest";
import type { Task } from "../../src/domain/models/task";
import type { Result } from "../../src/domain/result";
import { TaskService } from "../../src/services/TaskService";
import { makeTask } from "../queries/builders";
import { InMemoryBlockerRepository } from "./fakes/InMemoryBlockerRepository";
import { InMemoryTaskRepository } from "./fakes/InMemoryTaskRepository";

const TODAY = "2026-10-05";

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

function blockedTask(overrides: Partial<Task> = {}): Task {
  return makeTask("Fix mapping", {
    status: "blocked",
    blockedSince: "2026-10-02",
    blockedBy: "Client",
    waitingOn: "Credentials",
    ...overrides,
  });
}

let tasks: InMemoryTaskRepository;
let blockers: InMemoryBlockerRepository;
let service: TaskService;

beforeEach(() => {
  tasks = new InMemoryTaskRepository();
  blockers = new InMemoryBlockerRepository();
  service = new TaskService(tasks, () => TODAY, blockers);
});

describe("blockTask", () => {
  it("blocks a task and saves it in one write", async () => {
    const task = makeTask("Fix mapping", { status: "in-progress" });
    tasks.seed(task);
    const blocked = expectOk(
      await service.blockTask(task.path, {
        waitingOn: "Credentials",
        blockedBy: "Client",
        since: "2026-10-02",
      }),
    );
    expect(blocked).toMatchObject({
      status: "blocked",
      blockedSince: "2026-10-02",
      blockedBy: "Client",
      waitingOn: "Credentials",
    });
    expect(tasks.get(task.path)).toEqual(blocked);
    expect(tasks.updateCount).toBe(1);
    expect(blockers.createCalls).toBe(0);
  });

  it("refuses without a reason and writes nothing", async () => {
    const task = makeTask("Fix mapping", { status: "in-progress" });
    tasks.seed(task);
    const reason = reasonOf(
      await service.blockTask(task.path, { waitingOn: "  ", since: TODAY }),
    );
    expect(reason).toContain("waiting");
    expect(tasks.updateCount).toBe(0);
  });

  it("refuses a completed task", async () => {
    const task = makeTask("Fix mapping", {
      status: "complete",
      completed: "2026-10-01",
    });
    tasks.seed(task);
    expect(
      reasonOf(
        await service.blockTask(task.path, { waitingOn: "Credentials", since: TODAY }),
      ),
    ).toContain("complete");
    expect(tasks.updateCount).toBe(0);
  });

  it("fails for an unknown task", async () => {
    expect(
      reasonOf(
        await service.blockTask("nope.md", { waitingOn: "Credentials", since: TODAY }),
      ),
    ).toContain("not found");
  });
});

describe("leaving blocked", () => {
  it("unblocks, clears the blocked fields and records the block", async () => {
    const task = blockedTask();
    tasks.seed(task);
    const updated = expectOk(await service.unblockTask(task.path));
    expect(updated.status).toBe("in-progress");
    expect(updated.blockedSince).toBeUndefined();
    expect(updated.waitingOn).toBeUndefined();
    expect(blockers.blockers).toHaveLength(1);
    expect(blockers.blockers[0]).toMatchObject({
      task: { path: task.path, name: "Fix mapping" },
      since: "2026-10-02",
      until: TODAY,
      blockedBy: "Client",
      waitingOn: "Credentials",
    });
    expect(tasks.updateCount).toBe(1);
  });

  it("writes the record before it updates the task", async () => {
    const task = blockedTask();
    tasks.seed(task);
    let recordsWhenUpdated = -1;
    tasks.onUpdate = () => {
      recordsWhenUpdated = blockers.createCalls;
    };
    await service.unblockTask(task.path);
    expect(recordsWhenUpdated).toBe(1);
  });

  it("refuses to unblock a task that is not blocked", async () => {
    const task = makeTask("Fix mapping", { status: "in-progress" });
    tasks.seed(task);
    expect(reasonOf(await service.unblockTask(task.path))).toContain("not blocked");
    expect(blockers.createCalls).toBe(0);
    expect(tasks.updateCount).toBe(0);
  });

  it("writes no record for a task blocked by hand with no start date", async () => {
    const task = makeTask("Fix mapping", { status: "blocked" });
    tasks.seed(task);
    expectOk(await service.unblockTask(task.path));
    expect(blockers.createCalls).toBe(0);
  });

  it("records the block when a blocked task is cancelled", async () => {
    const task = blockedTask();
    tasks.seed(task);
    const updated = expectOk(await service.changeTaskStatus(task.path, "cancelled"));
    expect(updated.status).toBe("cancelled");
    expect(updated.waitingOn).toBeUndefined();
    expect(blockers.blockers).toHaveLength(1);
  });

  it("records the block when a blocked task is completed", async () => {
    const task = blockedTask();
    tasks.seed(task);
    const updated = expectOk(await service.completeTask(task.path, "Done"));
    expect(updated.status).toBe("complete");
    expect(updated.blockedSince).toBeUndefined();
    expect(blockers.blockers).toHaveLength(1);
  });

  it("writes no record for a change that does not leave blocked", async () => {
    const task = makeTask("Fix mapping", { status: "in-progress" });
    tasks.seed(task);
    expectOk(await service.changeTaskStatus(task.path, "not-started"));
    expect(blockers.createCalls).toBe(0);
  });
});

describe("leaving blocked: failures", () => {
  it("leaves the task blocked when the record cannot be written", async () => {
    const task = blockedTask();
    tasks.seed(task);
    blockers.failCreate = "disk full";
    const reason = reasonOf(await service.unblockTask(task.path));
    expect(reason).toContain("Could not record");
    expect(reason).toContain("disk full");
    expect(tasks.updateCount).toBe(0);
    expect(tasks.get(task.path)?.status).toBe("blocked");
  });

  it("says the block was recorded when the task update fails afterwards", async () => {
    const task = blockedTask();
    tasks.seed(task);
    tasks.updateFailure = "disk full";
    const reason = reasonOf(await service.unblockTask(task.path));
    expect(reason).toContain("recorded");
    expect(reason).toContain("duplicate");
    expect(blockers.createCalls).toBe(1);
    expect(tasks.get(task.path)?.status).toBe("blocked");
  });

  it("records a second copy when the failed unblock is retried (known trade-off)", async () => {
    const task = blockedTask();
    tasks.seed(task);
    tasks.updateFailure = "disk full";
    await service.unblockTask(task.path);
    tasks.updateFailure = undefined;
    expectOk(await service.unblockTask(task.path));
    expect(blockers.blockers).toHaveLength(2);
    expect(blockers.blockers[1]?.name).toBe("2026-10-02 Fix mapping 2");
  });
});