import type { ListResult } from "../../../src/data/repositories/ListResult";
import type {
  BlockerRepository,
  NewBlockerInput,
} from "../../../src/data/repositories/BlockerRepository";
import type { Blocker } from "../../../src/domain/models/blocker";
import { fail, ok, type Result } from "../../../src/domain/result";
import { nextSessionName } from "../../../src/domain/rules/sessionName";

/** In-memory stand-in that mirrors the real contract and counts calls. */
export class InMemoryBlockerRepository implements BlockerRepository {
  readonly blockers: Blocker[] = [];
  createCalls = 0;
  /** When set, create() fails with this reason without writing. */
  failCreate: string | undefined = undefined;

  list(): ListResult<Blocker> {
    return { items: [...this.blockers], skipped: [] };
  }

  async create(input: NewBlockerInput): Promise<Result<Blocker>> {
    this.createCalls += 1;
    if (this.failCreate !== undefined) {
      return fail(this.failCreate);
    }
    const name = nextSessionName(
      input.since,
      input.task.name,
      this.blockers.map((blocker) => blocker.name),
    );
    const blocker: Blocker = {
      path: `Blockers/${name}.md`,
      name,
      task: { path: input.task.path, name: input.task.name },
      since: input.since,
      until: input.until,
      blockedBy: input.blockedBy,
      waitingOn: input.waitingOn,
    };
    this.blockers.push(blocker);
    return ok(blocker);
  }
}