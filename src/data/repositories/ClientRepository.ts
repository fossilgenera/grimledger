import { Client } from "../../domain/models/client";
import { MapResult } from "../mapping/mapResult";
import { ListResult } from "./ListResult";

export interface ClientRepository {
    list(): ListResult<Client>;
    /** Does not throw for an invalid or duplicate client name. */
    create(name: string): Promise<MapResult<Client>>;
}