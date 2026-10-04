import { Notice, Plugin } from "obsidian";

export default class GrimledgerPlugin extends Plugin {
  override async onload(): Promise<void> {
    console.log("Grimledger: loaded");

    this.addCommand({
      id: "say-hello",
      name: "Say hello",
      callback: () => {
        new Notice("Hello again from Grimledger!");
      },
    });
  }

  override onunload(): void {
    console.log("Grimledger: unloaded");
  }
}
