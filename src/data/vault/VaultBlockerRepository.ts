import type { App } from "obsidian";
import type { Blocker } from "../../domain/models/blocker";
import { fail, ok, type Result } from "../../domain/result";
import { nextSessionName } from "../../domain/rules/sessionName";
import type { IndexStore } from "../index/IndexStore";
import { blockerToFrontmatter } from "../mapping/blockerMapper";
import { parseWikilinkTarget } from "../mapping/wikilink";
import type {
  BlockerRepository,
  NewBlockerInput,
} from "../repositories/BlockerRepository";
import { copyListResult, type ListResult } from "../repositories/ListResult";
import {
  blockerFolderPath,
  blockerNotePath,
  folderOf,
  noteNameOf,
} from "../VaultLayout";
import { ensureFolder } from "./ensureFolder";

const WIKILINK_HELP = `Obsidian is not generating wikilinks. Turn on settings > Files and links > "Use [[Wikilinks]]", then try again.`;

export class VaultBlockerRepository implements BlockerRepository {
  constructor(
    private readonly app: App,
    private readonly store: IndexStore,
  ) {}

  list(): ListResult<Blocker> {
    return copyListResult(this.store.snapshot.blockers);
  }

  async create(input: NewBlockerInput): Promise<Result<Blocker>> {
    if (input.until < input.since) {
      return fail("A blocker cannot end before it starts.");
    }

    const projectPath = input.task.project.path;
    if (this.app.vault.getFileByPath(projectPath) === null) {
      return fail(`Project note "${projectPath}" does not exist.`);
    }
    if (folderOf(projectPath) === "") {
      return fail(
        `Project note "${projectPath}" is not inside a folder, so a blocker cannot be stored beside it.`,
      );
    }
    const taskFile = this.app.vault.getFileByPath(input.task.path);
    if (taskFile === null) {
      return fail(`Task note "${input.task.path}" does not exist.`);
    }

    // The name comes from the real files, not the index, which lags writes.
    // The same "<date> <name>" with a number suffix rule that sessions use.
    const folder = blockerFolderPath(projectPath);
    const existingNames = this.app.vault
      .getMarkdownFiles()
      .filter((file) => folderOf(file.path) === folder)
      .map((file) => noteNameOf(file.path));
    const name = nextSessionName(input.since, input.task.name, existingNames);
    const notePath = blockerNotePath(projectPath, name);

    const taskLink = this.app.fileManager.generateMarkdownLink(
      taskFile,
      notePath,
    );
    if (parseWikilinkTarget(taskLink) === undefined) {
      return fail(WIKILINK_HELP);
    }

    await ensureFolder(this.app.vault, folder);
    const file = await this.app.vault.create(notePath, "");
    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      Object.assign(
        frontmatter,
        blockerToFrontmatter({
          taskLink,
          since: input.since,
          until: input.until,
          blockedBy: input.blockedBy,
          waitingOn: input.waitingOn,
        }),
      );
    });

    return ok({
      path: notePath,
      name: noteNameOf(notePath),
      task: { path: input.task.path, name: input.task.name },
      since: input.since,
      until: input.until,
      blockedBy: input.blockedBy,
      waitingOn: input.waitingOn,
    });
  }
}
