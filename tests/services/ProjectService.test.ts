import { beforeEach, describe, expect, it } from "vitest";
import type { Result } from "../../src/domain/result";
import { ProjectService } from "../../src/services/ProjectService";
import { makeProject } from "../queries/builders";
import { InMemoryProjectRepository } from "./fakes/InMemoryProjectRepository";

function reasonOf(result: Result<unknown>): string {
  if (result.ok) throw new Error("Expected a failure, got a success.");
  return result.reason;
}

describe("ProjectService.setCurrentFocus", () => {
  let repo: InMemoryProjectRepository;
  let service: ProjectService;

  beforeEach(() => {
    repo = new InMemoryProjectRepository();
    service = new ProjectService(repo);
  });

  it("marks an active project and writes it once", async () => {
    const project = makeProject("MRI Reporting");
    repo.seed(project);

    const result = await service.setCurrentFocus(project.path, true);

    expect(result.ok).toBe(true);
    expect(repo.get(project.path)?.currentFocus).toBe(true);
    expect(repo.updateCount).toBe(1);
  });

  it("clears the flag", async () => {
    const project = makeProject("MRI Reporting", { currentFocus: true });
    repo.seed(project);

    const result = await service.setCurrentFocus(project.path, false);

    expect(result.ok).toBe(true);
    expect(repo.get(project.path)?.currentFocus).toBe(false);
  });

  it("changes nothing but the flag", async () => {
    const project = makeProject("MRI Reporting", {
      priority: "critical",
      startDate: "2026-09-15",
    });
    repo.seed(project);

    await service.setCurrentFocus(project.path, true);

    expect(repo.get(project.path)).toEqual({ ...project, currentFocus: true });
  });

  it.each(["paused", "completed", "archived"] as const)(
    "refuses to mark a %s project and writes nothing",
    async (status) => {
      const project = makeProject("MRI Reporting", { status });
      repo.seed(project);

      const result = await service.setCurrentFocus(project.path, true);

      expect(reasonOf(result)).toContain("active");
      expect(repo.get(project.path)).toEqual(project);
      expect(repo.updateCount).toBe(0);
    },
  );

  it("allows clearing a stale flag on a paused project", async () => {
    const project = makeProject("MRI Reporting", {
      status: "paused",
      currentFocus: true,
    });
    repo.seed(project);

    const result = await service.setCurrentFocus(project.path, false);

    expect(result.ok).toBe(true);
    expect(repo.get(project.path)?.currentFocus).toBe(false);
  });

  it("fails for an unknown project and writes nothing", async () => {
    const result = await service.setCurrentFocus("Work/Nowhere.md", true);

    expect(reasonOf(result)).toContain("not found");
    expect(repo.updateCount).toBe(0);
  });

  it("is safe to repeat", async () => {
    const project = makeProject("MRI Reporting");
    repo.seed(project);

    const first = await service.setCurrentFocus(project.path, true);
    const second = await service.setCurrentFocus(project.path, true);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(repo.get(project.path)?.currentFocus).toBe(true);
  });

  it("reads the project fresh, so it sees edits made since it was listed", async () => {
    const project = makeProject("MRI Reporting");
    repo.seed(project);
    // Simulates the user pausing the project by hand.
    repo.seed({ ...project, status: "paused" });

    const result = await service.setCurrentFocus(project.path, true);

    expect(reasonOf(result)).toContain("active");
  });
});