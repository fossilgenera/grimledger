import { Client } from "../../domain/models/client";
import { Project } from "../../domain/models/project";
import { Task } from "../../domain/models/task";
import { fail, ok, Result } from "../../domain/result";
import { EntityRef } from "../../domain/types";
import { clientFromFrontMatter } from "../mapping/clientMapper";
import { projectFromFrontmatter } from "../mapping/projectMapper";
import { taskFromFrontmatter } from "../mapping/taskMapper";
import { ListResult } from "../repositories/ListResult";
import { noteNameOf } from "../VaultLayout";

/** What the Obsidian adapter reads from one markdown note. */
export interface NoteSnapshot {
    path: string;
    frontmatter: Readonly<Record<string, unknown>> | undefined;
}

/**
 * Resolves a link target written in the note at `SourcePath` to the path of
 * the note it points at, or undefined.
 */
export type LinkResolver = (
    linkPath: string,
    sourcePath: string,
) => string | undefined;

export interface IndexSnapshot { 
    clients: ListResult<Client>;
    projects: ListResult<Project>;
    tasks: ListResult<Task>;
}

export const EMPTY_INDEX: IndexSnapshot = {
    clients: { items: [], skipped: [] },
    projects: { items: [], skipped: [] },
    tasks: { items: [], skipped: [] },
};

function comparePath(a: string, b: string): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

/**
 * Resolves a link and checks the target note claims the expected type.
 * Only the target's `type` is checked, not whether it passed validation.
 */
function resolveReference(
    linkPath: string,
    sourcePath: string,
    expectedType: "client" | "project",
    resolveLink: LinkResolver,
    typeByPath: Readonly<Map<string, unknown>>,
): Result<EntityRef> {
    const label = expectedType === "client" ? "Client" : "Project";

    const targetPath = resolveLink(linkPath, sourcePath);
    if (targetPath === undefined) {
        return fail(`${label} link target "${linkPath}" does not resolve to a note.`);
    }
    if (typeByPath.get(targetPath) !== expectedType) {
        return fail(
        `${label} link points to "${targetPath}", which is not a ${expectedType} note.`,
        );        
    }
    return ok({ path: targetPath, name: noteNameOf(targetPath) });
}

/**
 * Builds the whole index from note snapshots. Notes whose `type` is not ours are ignored.
 * Notes that claim our type but fail validation, or have a bad link, are listed as 
 * skipped with a reason.
 * @param notes 
 * @param resolveLink 
 */
export function buildIndex(
    notes: readonly NoteSnapshot[],
    resolveLink: LinkResolver,
): IndexSnapshot {
    const sorted = [...notes].sort((a, b) => comparePath(a.path, b.path));

    // Pass 1: The type each note claims, so links can be checked without re-asking.
    const typeByPath = new Map<string, unknown>();
    for (const note of sorted) {
        typeByPath.set(note.path, note.frontmatter?.["type"]);
    }

    const clients: ListResult<Client> = { items: [], skipped: [] };
    const projects: ListResult<Project> = { items: [], skipped: [] };
    const tasks: ListResult<Task> = { items: [], skipped: [] };

    // Pass 2: Map every note that claims one of our types.
    for (const note of sorted) {
        switch (note.frontmatter?.["type"]) {
            case "client": {
                const mapped = clientFromFrontMatter(note.path, note.frontmatter);
                if (mapped.ok) {
                    clients.items.push(mapped.value);
                } else {
                    clients.skipped.push({ path: note.path, reason: mapped.reason });
                }
                break;
            }

            case "project": {
                const mapped = projectFromFrontmatter(note.path, note.frontmatter);
                if (!mapped.ok) {
                    projects.skipped.push({ path: note.path, reason: mapped.reason });
                    break;
                }
                const { clientLinkPath, ...rest } = mapped.value;
                const client = resolveReference(
                    clientLinkPath,
                    note.path,
                    "client",
                    resolveLink,
                    typeByPath,
                );
                if (!client.ok) {
                    projects.skipped.push({ path: note.path, reason: client.reason });
                    break;
                }
                projects.items.push({ ...rest, client: client.value });
                break;
            }

            case "task": {
                const mapped = taskFromFrontmatter(note.path, note.frontmatter);
                if (!mapped.ok) {
                    tasks.skipped.push({ path: note.path, reason: mapped.reason });
                    break;
                }
                const { projectLinkPath, ...rest } = mapped.value;
                const project = resolveReference(
                    projectLinkPath,
                    note.path,
                    "project",
                    resolveLink,
                    typeByPath,
                );
                if (!project.ok) {
                    tasks.skipped.push({ path: note.path, reason: project.reason });
                    break;
                }
                tasks.items.push({ ...rest, project: project.value });
            }

            default:
                // Not one of our types. Ignored silently.
                break;
        }
    }

    return { clients, projects, tasks };
}