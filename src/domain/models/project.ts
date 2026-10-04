import type { EntityRef, IsoDate, Priority, ProjectStatus } from "../types";

export interface Project extends EntityRef {
  client: EntityRef;
  status: ProjectStatus;
  priority: Priority;
  startDate: IsoDate | undefined;
  currentFocus: boolean;
}
