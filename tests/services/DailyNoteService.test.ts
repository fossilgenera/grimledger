import { beforeEach, describe, expect, it } from "vitest";
import { DailyNoteService } from "../../src/services/DailyNoteService";
import { InMemoryDailyNoteRepository } from "./fakes/InMemoryDailyNoteRepository";

let repo: InMemoryDailyNoteRepository;
let service: DailyNoteService;

beforeEach(() => {
  repo = new InMemoryDailyNoteRepository();
  service = new DailyNoteService(repo, () => "2026-10-27");
});

describe("DailyNoteService.ensureToday", () => {
  it("asks for the note dated today", async () => {
    const result = await service.ensureToday();
    expect(repo.ensuredDates).toEqual(["2026-10-27"]);
    expect(result.ok && result.value.date).toBe("2026-10-27");
    expect(result.ok && result.value.path).toBe("Work/Daily/2026/2026-10-27.md");
  });

  it("creates the note once however often it is asked", async () => {
    await service.ensureToday();
    const second = await service.ensureToday();
    expect(second.ok).toBe(true);
    expect(repo.createdCount).toBe(1);
  });

  it("passes a repository failure through", async () => {
    repo.failure = "disk full";
    const result = await service.ensureToday();
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toBe("disk full");
  });
});