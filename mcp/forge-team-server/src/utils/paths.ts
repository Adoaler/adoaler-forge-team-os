import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

export function workspaceRoot(): string {
  return resolve(process.env.FORGE_TEAM_WORKSPACE || process.cwd());
}

export function dataDir(): string {
  const dir = resolve(workspaceRoot(), process.env.FORGE_TEAM_DATA_DIR || ".forge-team");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function databasePath(): string {
  return resolve(dataDir(), "forge-team.sqlite");
}
