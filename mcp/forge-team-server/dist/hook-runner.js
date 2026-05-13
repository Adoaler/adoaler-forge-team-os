import { ForgeDatabase } from "./db/sqlite.js";
import { applyMigrations } from "./db/migrations.js";
import { governorCheck, getGovernorState } from "./engine/vetoGovernor.js";
import { indexRepo } from "./engine/repoWorldModel.js";
const mode = process.argv[2] ?? "post-edit";
const db = new ForgeDatabase();
applyMigrations(db);
if (mode === "post-edit") {
    const indexed = indexRepo(db);
    const check = governorCheck(db);
    console.error("[forge-team hook] post-edit indexed=" + indexed.indexed_files + " allowed=" + check.allowed);
}
else {
    console.error("[forge-team hook] " + mode + " state=" + getGovernorState(db));
}
db.close();
