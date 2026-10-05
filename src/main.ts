import { Plugin } from "obsidian";
import { VaultClientRepository } from "./data/vault/VaultClientRepository";
import { VaultProjectRepository } from "./data/vault/VaultProjectRepository";
import { registerCommands } from "./obsidian/commands";

export default class GrimledgerPlugin extends Plugin {
  override async onload(): Promise<void> {
    const clients = new VaultClientRepository(this.app);
    const projects = new VaultProjectRepository(this.app);

    registerCommands(this, { clients, projects });
  }
}
