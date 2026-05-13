import { stringifyJson } from "../utils/json.js";
import { nowIso } from "../utils/validators.js";
import { id } from "./ids.js";
import { getFileState, updateFileState } from "./fileStateMachine.js";
export function saveContinuation(db, input) {
    const continuationId = id("cont");
    const now = nowIso();
    db.run("INSERT INTO continuations (id, file_path, current_hash, last_completed_symbol, open_blocks, imports_declared, public_api_emitted, remaining_plan, critic_warnings, tests_required, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'partial', ?, ?)", [
        continuationId, input.file_path, input.current_hash, input.last_completed_symbol ?? null,
        stringifyJson(input.open_blocks ?? []), stringifyJson(input.imports_declared ?? []), stringifyJson(input.public_api_emitted ?? []),
        input.remaining_plan, stringifyJson(input.critic_warnings ?? []), stringifyJson(input.tests_required ?? []), now, now
    ]);
    updateFileState(db, { file_path: input.file_path, status: "partial", current_hash: input.current_hash, last_completed_symbol: input.last_completed_symbol, remaining_plan: input.remaining_plan, critic_warnings: input.critic_warnings, tests_required: input.tests_required, last_chunk_id: continuationId });
    return db.get("SELECT * FROM continuations WHERE id = ?", [continuationId]);
}
export function nextContinuation(db, filePath) {
    if (filePath)
        return db.get("SELECT * FROM continuations WHERE file_path = ? AND status = 'partial' ORDER BY updated_at DESC LIMIT 1", [filePath]) ?? null;
    return db.get("SELECT * FROM continuations WHERE status = 'partial' ORDER BY updated_at DESC LIMIT 1") ?? null;
}
export function markComplete(db, filePath) {
    const now = nowIso();
    db.run("UPDATE continuations SET status = 'complete', updated_at = ? WHERE file_path = ? AND status = 'partial'", [now, filePath]);
    return updateFileState(db, { file_path: filePath, status: "complete" });
}
export function resumePrompt(db, filePath) {
    const continuation = nextContinuation(db, filePath);
    const state = getFileState(db, filePath);
    return {
        file_path: filePath,
        continuation,
        state,
        instructions: [
            "do not rewrite previous content",
            "continue after the last completed symbol",
            "stop only at a safe boundary"
        ]
    };
}
