import { beforeEach, describe, expect, it } from "vitest";
import { DailyNoteService } from "../../src/services/DailyNoteService";
import { InMemoryDailyNoteRepository } from "./fakes/InMemoryDailyNoteRepository";

let repo: InMemoryDailyNoteRepository;
let service: DailyNoteService;

beforeEach(() => {
  repo = new InMemoryDailyNoteRepository();
  service = new DailyNoteService(repo, () => "2026-10-27");
});

describe("DailyNoteService.ensureFor", () => {
  it("creates the note for a past date", async () => {
    const result = await service.ensureFor("2026-10-20");
    expect(result.ok && result.value.date).toBe("2026-10-20");
    expect(result.ok && result.value.path).toBe(
      "Work/Daily/2026/2026-10-20.md",
    );
  });

  it("allows today", async () => {
    expect((await service.ensureFor("2026-10-27")).ok).toBe(true);
  });

  it("refuses a date after today and asks for nothing", async () => {
    const result = await service.ensureFor("2026-10-28");
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toContain("after today");
    expect(repo.ensuredDates).toEqual([]);
  });

  it("ensureToday still asks for today's date", async () => {
    await service.ensureToday();
    expect(repo.ensuredDates).toEqual(["2026-10-27"]);
  });
});
