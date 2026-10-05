import { EntityRef, IsoDate, Priority, TaskStatus } from "../types";

export interface Task extends EntityRef {
    project: EntityRef;
    status: TaskStatus;
    priority: Priority;
    due: IsoDate | undefined;
    estimatedMinutes: number | undefined;
    created: IsoDate;
    completed: IsoDate | undefined;
    outcome: string | undefined;
}