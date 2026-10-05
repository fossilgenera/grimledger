import { Client } from "../../domain/models/client";
import { Result } from "../../domain/result";
import { ListResult } from "./ListResult";

export interface ClientRepository {
    list(): ListResult<Client>;
    /** Does not throw for an invalid or duplicate client name. */
    create(name: string): Promise<Result<Client>>;
}