import { Vault } from "obsidian";

/** Creates the folder and any missing parents. */
export async function ensureFolder(vault: Vault, path: string): Promise<void> {
    let current = "";
    for (const segment of path.split("/")) {
        current = current === "" ? segment : `${current}/${segment}`;
        if (vault.getFolderByPath(current) !== null) {
            continue;
        }
        try {
            await vault.createFolder(current);
        } catch (err) {
            if (vault.getFolderByPath(current) === null) {
                throw err;
            }
        }
    }
}