import { nowIso } from "../utils/validators.js";
export function getGovernorState(db) {
    return db.get("SELECT value FROM project_state WHERE key = 'governor.state'")?.value ?? "NORMAL";
}
export function setGovernorState(db, state) {
    db.run("INSERT INTO project_state (key, value, updated_at) VALUES ('governor.state', ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at", [state, nowIso()]);
    return { state };
}
export function governorCheck(db) {
    const state = getGovernorState(db);
    const latestReject = db.get("SELECT id FROM critic_reports WHERE verdict = 'reject' ORDER BY created_at DESC LIMIT 1");
    const partialWithoutContinuation = db.all("SELECT file_path FROM files WHERE status = 'partial' AND file_path NOT IN (SELECT file_path FROM continuations WHERE status = 'partial')");
    const openChanges = db.all("SELECT id FROM change_requests WHERE status IN ('proposed','analyzing','approved','implementing')");
    const vetoes = [];
    if (latestReject && state !== "REPAIR_ONLY")
        vetoes.push("Critic rejected but governor is not in REPAIR_ONLY");
    if (partialWithoutContinuation.length)
        vetoes.push("Partial files without continuation records");
    if (openChanges.length && !["CHANGE_REQUEST", "IMPACT_ANALYSIS", "REPLAN", "MIGRATION"].includes(state))
        vetoes.push("Open Change Request outside change flow");
    return { state, allowed: vetoes.length === 0, vetoes };
}
