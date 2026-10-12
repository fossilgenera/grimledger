import { TaskStatus } from "../../domain/types";
import { capitalise } from "./capitalise";

/** Display text for a status slug e.g. "not-started" becomes "Not started". */
export function statusLabel(status: TaskStatus): string {
    return capitalise(status.replace(/-/g, " "));
}