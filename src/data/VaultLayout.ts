export const WORK_ROOT = "Work";

const CLIENTS_FOLDER = `${WORK_ROOT}/Clients`;
const PROJECTS_SEGMENT = "Projects";

const FORBIDDEN_CHARS = /[\\/:*?"<>|#^[\]]/;

/**
 * Returns an error message if the name cannot be used as a file/folder/link name, or undefined if the name is valid.
 */
export function validateEntityName(name: string): string | undefined {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return "Name cannot be empty";
  }
  if (trimmed.startsWith(".")) {
    return "Name cannot start with a dot";
  }
  if (trimmed.endsWith(".")) {
    return "Name cannot end with a dot";
  }

  const match = FORBIDDEN_CHARS.exec(trimmed);
  if (match) {
    return `Name cannot contain the character "${match[0]}"`;
  }

  return undefined;
}

/**
 * Returns everything before the last "/"".
 * Returns "" if there is no "/".
 * */
export function folderOf(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index);
}

/** Validates and trims. Throws on an invalid name. */
function safeName(name: string): string {
  const error = validateEntityName(name);
  if (error !== undefined) {
    throw new Error(`Invalid entity name "${name}": ${error}`);
  }
  return name.trim();
}

export function clientFolderPath(clientName: string): string {
  return `${CLIENTS_FOLDER}/${safeName(clientName)}`;
}

export function clientNotePath(clientName: string): string {
  const name = safeName(clientName);
  return `${CLIENTS_FOLDER}/${name}/${name}.md`;
}

/** Built from client note's actual location instead of just the name */
export function projectFolderPath(
  clientNotePath: string,
  projectName: string,
): string {
  return `${folderOf(clientNotePath)}/${PROJECTS_SEGMENT}/${safeName(projectName)}`;
}

export function projectNotePath(
  clientNotePath: string,
  projectName: string,
): string {
  const name = safeName(projectName);
  return `${folderOf(clientNotePath)}/${PROJECTS_SEGMENT}/${name}/${name}.md`;
}

/** "Work/Clients/ABC Bank/ABC Bank.md" returns "ABC Bank". */
export function noteNameOf(path: string): string {
  const fileName = path.slice(path.lastIndexOf("/") + 1);
  return fileName.endsWith(".md") ? fileName.slice(0, -3) : fileName;
}
