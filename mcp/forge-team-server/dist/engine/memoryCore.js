import { id } from "./ids.js";
import { nowIso } from "../utils/validators.js";
export function writeMemory(db, input) {
    const created = nowIso();
    if (input.kind === "bug") {
        const bugId = id("bug");
        db.run("INSERT INTO bugs (id, project_id, title, category, symptoms, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'open', ?, ?)", [bugId, input.project_id ?? null, input.topic, input.reason ?? "general", input.content, created, created]);
        return { id: bugId, table: "bugs" };
    }
    const decisionId = id("dec");
    db.run("INSERT INTO decisions (id, project_id, topic, decision, reason, linked_task_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [decisionId, input.project_id ?? null, input.topic, input.content, input.reason ?? "recorded by Team OS", input.task_id ?? null, created]);
    return { id: decisionId, table: "decisions" };
}
export function searchMemory(db, query, limit = 20) {
    const like = "%" + query + "%";
    const decisions = db.all("SELECT id, 'decision' AS kind, topic, decision AS content, reason, created_at FROM decisions WHERE topic LIKE ? OR decision LIKE ? OR reason LIKE ? ORDER BY created_at DESC LIMIT ?", [like, like, like, limit]);
    const bugs = db.all("SELECT id, 'bug' AS kind, title AS topic, symptoms AS content, root_cause AS reason, created_at FROM bugs WHERE title LIKE ? OR symptoms LIKE ? OR category LIKE ? ORDER BY created_at DESC LIMIT ?", [like, like, like, limit]);
    return [...decisions, ...bugs].slice(0, limit);
}
