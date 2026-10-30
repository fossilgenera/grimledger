import type { EntityRef, IsoDate } from "../types";

/** One note per calendar day. `name` is the file name, `date` comes from the property. */
export interface DailyNote extends EntityRef {
  date: IsoDate;
}
