import type { EntityRef, IsoDate } from "../types";

/**
 * A closed period during which a task was blocked. Written when the block ends, so a
 * blocker always has both dates. Duration is derived from them.
 */
export interface Blocker extends EntityRef {
  task: EntityRef;
  since: IsoDate;
  until: IsoDate;
  blockedBy: string | undefined;
  waitingOn: string | undefined;
}
