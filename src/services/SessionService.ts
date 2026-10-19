import type { TaskRepository } from "../data/repositories/TaskRepository";
import type { WorkSessionRepository } from "../data/repositories/WorkSessionRepository";
import type { WorkSession } from "../domain/models/workSession";
import { fail, type Result } from "../domain/result";
import type { IsoDate } from "../domain/types";

export interface LogTimeInput {
    taskPath: string;
    date: IsoDate; //Already parsed and validated as a real calendar date by the caller.
    minutes: number; // Already parsed to whole minutes by caller
    note?: string;
}

export class SessionService {
    constructor(
        private readonly tasks: TaskRepository,
        private readonly sessions: WorkSessionRepository,
        private readonly today: () => IsoDate,
    ) {}

    async logTime(input: LogTimeInput): Promise<Result<WorkSession>> {
        if (!Number.isInteger(input.minutes) || input.minutes <= 0) {
            return fail("Minutes must be a positive whole number.");
        }

        if (input.date > this.today()) {
            return fail("Time cannot be logged for a date in the future");
        }

        const task = this.tasks
            .list()
            .items.find((candidate) => candidate.path === input.taskPath);
        if (task === undefined) {
            return fail(`Task "${input.taskPath}" was not found.`);
        }

        return this.sessions.create({
            task,
            date: input.date,
            minutes: input.minutes,
            note: input.note,
        });
    }
}