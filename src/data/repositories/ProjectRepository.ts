import { Project } from "../../domain/models/project";
import { EntityRef, IsoDate, Priority } from "../../domain/types";
import { Result } from "../../domain/result";
import { ListResult } from "./ListResult";

export interface NewProjectInput {
    client: EntityRef;
    name: string;
    priority: Priority;
    startDate?: IsoDate;
    currentFocus?: boolean;
}

export interface ProjectRepository {
    list(): ListResult<Project>;
    /** Does not throw for an invalid or duplicate project name or a missing client. */
    create(input: NewProjectInput): Promise<Result<Project>>;
    /**
     * Writes the project's mutable fields to its note. Writes absolute values so repeating the call is safe.
     * Never changes type, client or start date.
     */
    update(project: Project): Promise<Result<Project>>;
}