import { Client } from "../../domain/models/client";
import { CLIENT_STATUSES } from "../../domain/types";
import { noteNameOf } from "../VaultLayout";
import { describeValue, isOneOf } from "./fields";
import { fail, Result, ok } from "../../domain/result";

type FrontMatter = Readonly<Record<string, unknown>> | undefined;

export function clientFromFrontMatter(path: string, frontMatter: FrontMatter): Result<Client> {
    if (frontMatter?.["type"] !== "client") {
        return fail('Not a client note: "type" is not "client"');
    }

    const status = frontMatter["status"];
    if (!isOneOf(CLIENT_STATUSES, status)) {
        return fail(`Invalid status ${describeValue(status)}`);
    }

    return ok({ path, name: noteNameOf(path), status });
}

/** Only the properties this plugin owns. */
export function clientToFrontMatter(client: Pick<Client, "status">): Record<string, unknown> {
    return {
        type: "client",
        status: client.status
    };
}