import type { ClientStatus, EntityRef } from "../types";

export interface Client extends EntityRef {
  status: ClientStatus;
}
