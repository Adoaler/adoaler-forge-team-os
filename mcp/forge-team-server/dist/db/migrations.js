import { schemaSql } from "./schema.js";
import { nowIso } from "../utils/validators.js";
const migrationId = "0001_initial_team_os_schema";
export function applyMigrations(db) {
    db.exec(schemaSql[0] || "");
    const existing = db.get("SELECT id FROM schema_migrations WHERE id = ?", [migrationId]);
    if (!existing) {
        for (const sql of schemaSql.slice(1))
            db.exec(sql);
        db.run("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)", [migrationId, nowIso()]);
    }
    else {
        for (const sql of schemaSql.slice(1))
            db.exec(sql);
    }
    const state = db.get("SELECT key FROM project_state WHERE key = 'governor.state'");
    if (!state)
        db.run("INSERT INTO project_state (key, value, updated_at) VALUES ('governor.state', 'NORMAL', ?)", [nowIso()]);
}
