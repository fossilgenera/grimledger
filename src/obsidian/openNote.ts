import { type App, FileView, type WorkspaceLeaf } from "obsidian";

/**
 * Shows the note in the tab that always has it open, or opens it in a new tab. Takes a path, so no
 * TFile reaches the caller.
 */
export async function openNoteInTab(app: App, path: string): Promise<void> {
  // Collected into an array
  const showing: WorkspaceLeaf[] = [];
  app.workspace.iterateAllLeaves((leaf) => {
    if (leaf.view instanceof FileView && leaf.view.file?.path === path) {
      showing.push(leaf);
    }
  });

  const existing = showing[0];
  if (existing !== undefined) {
    await app.workspace.revealLeaf(existing);
    return;
  }
  await app.workspace.openLinkText(path, "", "tab");
}
