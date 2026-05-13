import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sha256Text } from "../utils/hash.js";
import { workspaceRoot } from "../utils/paths.js";
import { nowIso } from "../utils/validators.js";
import { id } from "./ids.js";
export function checkpoint(db, label) {
    const files = db.all("SELECT file_path, current_hash FROM files ORDER BY file_path");
    const fileHashes = {};
    for (const file of files) {
        const full = resolve(workspaceRoot(), file.file_path);
        fileHashes[file.file_path] = existsSync(full) ? sha256Text(readFileSync(full, "utf8")) : file.current_hash;
    }
    const checkpointId = id("chk");
    db.run("INSERT INTO checkpoints (id, label, file_hashes, task_snapshot, created_at) VALUES (?, ?, ?, ?, ?)", [checkpointId, label, JSON.stringify(fileHashes), JSON.stringify(db.all("SELECT id, title, status FROM tasks")), nowIso()]);
    return db.get("SELECT * FROM checkpoints WHERE id = ?", [checkpointId]);
}
export function verifyReady(db) {
    const partial = db.all("SELECT file_path FROM files WHERE status = 'partial'");
    const rejected = db.get("SELECT id FROM critic_reports WHERE verdict = 'reject' ORDER BY created_at DESC LIMIT 1");
    const openChanges = db.all("SELECT id FROM change_requests WHERE status NOT IN ('completed','rejected','rolled_back')");
    const incomplete = db.all("SELECT id FROM tasks WHERE status NOT IN ('complete','cancelled_by_change') AND type != 'release'");
    const blockers = [];
    if (partial.length)
        blockers.push("partial files exist");
    if (rejected)
        blockers.push("latest critic rejected");
    if (openChanges.length)
        blockers.push("open change requests exist");
    if (incomplete.length)
        blockers.push("task graph has incomplete work");
    return { ready: blockers.length === 0, blockers };
}
