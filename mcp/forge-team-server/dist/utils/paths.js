import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
export function workspaceRoot() {
    return resolve(process.env.FORGE_TEAM_WORKSPACE || process.cwd());
}
export function dataDir() {
    const dir = resolve(workspaceRoot(), process.env.FORGE_TEAM_DATA_DIR || ".forge-team");
    mkdirSync(dir, { recursive: true });
    return dir;
}
export function databasePath() {
    return resolve(dataDir(), "forge-team.sqlite");
}
