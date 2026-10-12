import { describe, expect, it } from "vitest";
import { TASK_STATUSES, TaskStatus } from "../../../src/domain/types";
import { statusLabel } from "../../../src/ui/modals/statusLabel";

const EXPECTED: Readonly<Record<TaskStatus, string>> = {
    "not-started": "Not started",
    "in-progress": "In progress",
    blocked: "Blocked",
    complete: "Complete",
    cancelled: "Cancelled",
};

describe("statusLabel", () => {
    for (const status of TASK_STATUSES) {
        it(`formats ${status}`, () => {
            expect(statusLabel(status)).toBe(EXPECTED[status]);
        });
    }
});