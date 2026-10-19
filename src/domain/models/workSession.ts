import type { EntityRef, IsoDate } from "../types";

export interface WorkSession extends EntityRef {
    task: EntityRef;
    date: IsoDate;
    minutes: number;
    note: string | undefined;
}