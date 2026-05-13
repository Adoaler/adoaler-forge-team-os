import { stringifyJson } from "../utils/json.js";
import { nowIso } from "../utils/validators.js";
export function getFileState(db, filePath) {
    return db.get("SELECT * FROM files WHERE file_path = ?", [filePath]) ?? null;
}
export function updateFileState(db, input) {
    const now = nowIso();
    db.run("INSERT INTO files (file_path, status, current_hash, last_completed_symbol, open_blocks, imports_declared, public_api_emitted, remaining_plan, critic_warnings, tests_required, last_chunk_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(file_path) DO UPDATE SET status=COALESCE(excluded.status, files.status), current_hash=COALESCE(excluded.current_hash, files.current_hash), last_completed_symbol=COALESCE(excluded.last_completed_symbol, files.last_completed_symbol), open_blocks=excluded.open_blocks, imports_declared=excluded.imports_declared, public_api_emitted=excluded.public_api_emitted, remaining_plan=COALESCE(excluded.remaining_plan, files.remaining_plan), critic_warnings=excluded.critic_warnings, tests_required=excluded.tests_required, last_chunk_id=COALESCE(excluded.last_chunk_id, files.last_chunk_id), updated_at=excluded.updated_at", [
        input.file_path, input.status ?? "planned", input.current_hash ?? null, input.last_completed_symbol ?? null,
        stringifyJson(input.open_blocks ?? []), stringifyJson(input.imports_declared ?? []), stringifyJson(input.public_api_emitted ?? []),
        input.remaining_plan ?? null, stringifyJson(input.critic_warnings ?? []), stringifyJson(input.tests_required ?? []), input.last_chunk_id ?? null, now
    ]);
    return getFileState(db, input.file_path);
}
