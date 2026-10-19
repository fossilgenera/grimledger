import type { WorkSession } from "../../../src/domain/models/workSession";
import { ok, type Result } from "../../../src/domain/result";
import { nextSessionName } from "../../../src/domain/rules/sessionName";
import type { ListResult } from "../../../src/data/repositories/ListResult";
import type {
  NewWorkSessionInput,
  WorkSessionRepository,
} from "../../../src/data/repositories/WorkSessionRepository";

/** In-memory stand-in that mirrors the real contract and counts calls. */
export class InMemoryWorkSessionRepository implements WorkSessionRepository {
  readonly sessions: WorkSession[] = [];
  createCalls = 0;

  list(): ListResult<WorkSession> {
    return { items: [...this.sessions], skipped: [] };
  }

  async create(input: NewWorkSessionInput): Promise<Result<WorkSession>> {
    this.createCalls += 1;
    const name = nextSessionName(
      input.date,
      input.task.name,
      this.sessions.map((session) => session.name),
    );
    const session: WorkSession = {
      path: `Work Sessions/${name}.md`,
      name,
      task: { path: input.task.path, name: input.task.name },
      date: input.date,
      minutes: input.minutes,
      note: input.note,
    };
    this.sessions.push(session);
    return ok(session);
  }
}