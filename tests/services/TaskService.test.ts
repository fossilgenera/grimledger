import { beforeEach, describe, expect, it } from "vitest";
import type { Task } from "../../src/domain/models/task";
import type { Result } from "../../src/domain/result";
import { TaskService } from "../../src/services/TaskService";
import { InMemoryTaskRepository } from "./fakes/InMemoryTaskRepository";

const TODAY = "2026-10-05";

const PROJECT = {
  path: "Work/Clients/ABC Bank/Projects/MRI Reporting/MRI Reporting.md",
  name: "MRI Reporting",
};

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    path: `${PROJECT.path.replace("MRI Reporting.md", "")}Tasks/Fix mapping.md`,
    name: "Fix mapping",
    project: PROJECT,
    status: "in-progress",
    priority: "medium",
    due: undefined,
    estimatedMinutes: undefined,
    created: "2026-10-01",
    completed: undefined,
    outcome: undefined,
    ...overrides,
  };
}

function expectOk(result: Result<Task>): Task {
  if (!result.ok) {
    throw new Error(`Expected success but got failure: ${result.reason}`);
  }
  return result.value;
}

function expectFail(result: Result<Task>): string {
  if (result.ok) {
    throw new Error("Expected a failure but got success");
  }
  return result.reason;
}

let repo: InMemoryTaskRepository;
let service: TaskService;

beforeEach(() => {
  repo = new InMemoryTaskRepository();
  service = new TaskService(repo, () => TODAY);
});

describe("createTask", () => {
  it("sets created from today and starts as not-started", async () => {
    const task = expectOk(
      await service.createTask({
        project: PROJECT,
        name: "Write report",
        priority: "high",
        due: "2026-10-09",
        estimatedMinutes: 90,
      }),
    );
    expect(task.created).toBe(TODAY);
    expect(task.status).toBe("not-started");
    expect(task.priority).toBe("high");
    expect(task.due).toBe("2026-10-09");
    expect(task.estimatedMinutes).toBe(90);
    expect(repo.get(task.path)).toEqual(task);
  });

  it("returns the repository failure for a duplicate name", async () => {
    const input = { project: PROJECT, name: "Write report", priority: "low" as const };
    expectOk(await service.createTask(input));
    expect(expectFail(await service.createTask(input))).toContain("already exists");
  });

  it("returns the repository failure for an invalid name", async () => {
    const reason = expectFail(
      await service.createTask({ project: PROJECT, name: "bad/name", priority: "low" }),
    );
    expect(reason).toContain("cannot contain");
  });
});

describe("changeTaskStatus", () => {
  it("saves an allowed change", async () => {
    const task = makeTask({ status: "not-started" });
    repo.seed(task);
    const updated = expectOk(await service.changeTaskStatus(task.path, "in-progress"));
    expect(updated.status).toBe("in-progress");
    expect(repo.get(task.path)?.status).toBe("in-progress");
    expect(repo.updateCount).toBe(1);
  });

  it("rejects a disallowed change and writes nothing", async () => {
    const task = makeTask({ status: "cancelled" });
    repo.seed(task);
    const reason = expectFail(await service.changeTaskStatus(task.path, "complete"));
    expect(reason).toContain("cancelled");
    expect(reason).toContain("complete");
    expect(repo.updateCount).toBe(0);
    expect(repo.get(task.path)?.status).toBe("cancelled");
  });

  it("fails for an unknown task path", async () => {
    const reason = expectFail(await service.changeTaskStatus("nope.md", "blocked"));
    expect(reason).toContain("not found");
    expect(repo.updateCount).toBe(0);
  });

  it("clears the completed date when reopening", async () => {
    const task = makeTask({ status: "complete", completed: "2026-10-03" });
    repo.seed(task);
    const updated = expectOk(await service.changeTaskStatus(task.path, "in-progress"));
    expect(updated.completed).toBeUndefined();
    expect(repo.get(task.path)?.completed).toBeUndefined();
  });
});

describe("completeTask", () => {
  it("sets status, completed date and outcome in a single write", async () => {
    const task = makeTask();
    repo.seed(task);
    const updated = expectOk(await service.completeTask(task.path, "Fixed the mapping"));
    expect(updated.status).toBe("complete");
    expect(updated.completed).toBe(TODAY);
    expect(updated.outcome).toBe("Fixed the mapping");
    expect(repo.updateCount).toBe(1);
    expect(repo.get(task.path)).toEqual(updated);
  });

  it("trims the outcome", async () => {
    const task = makeTask();
    repo.seed(task);
    const updated = expectOk(await service.completeTask(task.path, "  Done  "));
    expect(updated.outcome).toBe("Done");
  });

  it("completes without an outcome", async () => {
    const task = makeTask();
    repo.seed(task);
    const updated = expectOk(await service.completeTask(task.path));
    expect(updated.status).toBe("complete");
    expect(updated.outcome).toBeUndefined();
  });

  it("keeps an existing outcome when the new one is empty", async () => {
    const task = makeTask({ outcome: "Earlier outcome" });
    repo.seed(task);
    const updated = expectOk(await service.completeTask(task.path, "   "));
    expect(updated.outcome).toBe("Earlier outcome");
  });

  it("replaces an existing outcome when a new one is given", async () => {
    const task = makeTask({ outcome: "Earlier outcome" });
    repo.seed(task);
    const updated = expectOk(await service.completeTask(task.path, "New outcome"));
    expect(updated.outcome).toBe("New outcome");
  });

  it("completes a blocked task", async () => {
    const task = makeTask({ status: "blocked" });
    repo.seed(task);
    expect(expectOk(await service.completeTask(task.path)).status).toBe("complete");
  });

  it("fails on a second completion and does not write again", async () => {
    const task = makeTask();
    repo.seed(task);
    expectOk(await service.completeTask(task.path, "First"));
    const reason = expectFail(await service.completeTask(task.path, "Second"));
    expect(reason).toContain("complete");
    expect(repo.updateCount).toBe(1);
    expect(repo.get(task.path)?.outcome).toBe("First");
  });

  it("refuses to complete a cancelled task", async () => {
    const task = makeTask({ status: "cancelled" });
    repo.seed(task);
    expectFail(await service.completeTask(task.path));
    expect(repo.updateCount).toBe(0);
  });

  it("fails for an unknown task path", async () => {
    expect(expectFail(await service.completeTask("nope.md"))).toContain("not found");
  });
});