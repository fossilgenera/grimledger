import { Project } from "../../domain/models/project";
import { EntityRef, IsoDate, Priority } from "../../domain/types";
import { MapResult } from "../mapping/mapResult";
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
    create(input: NewProjectInput): Promise<MapResult<Project>>;
}