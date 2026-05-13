import { nowIso } from "../utils/validators.js";
import { id } from "./ids.js";
import { searchMemory } from "./memoryCore.js";
import { createTask } from "./taskGraph.js";
export function classifyFailure(text) {
    if (/SyntaxError|parse/i.test(text))
        return "syntax_error";
    if (/TS\d+|type/i.test(text))
        return "type_error";
    if (/test failed|expect\(/i.test(text))
        return "test_failure";
    if (/circular/i.test(text))
        return "circular_dependency";
    if (/secret|token|private key/i.test(text))
        return "security_risk";
    if (/continuation|hash mismatch/i.test(text))
        return "continuation_corruption";
    return "integration_failure";
}
export function planRepair(db, input) {
    const category = classifyFailure(input.failure);
    const similar = searchMemory(db, category, 5);
    const task = createTask(db, {
        title: "Repair " + category,
        type: "repair",
        allowed_files: input.affected_files ?? [],
        acceptance_criteria: ["Failure is reproduced", "Smallest safe fix is applied", "Targeted gate passes", "Broad gate passes"],
        quality_gates: ["typecheck", "test"],
        required_agents: ["critic", "qa"],
        risk_level: category === "security_risk" ? "critical" : "high",
        status: "ready"
    });
    db.run("UPDATE project_state SET value = 'REPAIR_ONLY', updated_at = ? WHERE key = 'governor.state'", [nowIso()]);
    return { category, similar, repair_task: task };
}
export function closeRepair(db, input) {
    const now = nowIso();
    const bugId = id("bug");
    db.run("INSERT INTO bugs (id, title, category, symptoms, affected_files, fix_summary, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'fixed', ?, ?)", [bugId, input.title, input.category, input.symptoms, JSON.stringify(input.affected_files ?? []), input.fix_summary, now, now]);
    db.run("UPDATE project_state SET value = 'NORMAL', updated_at = ? WHERE key = 'governor.state'", [now]);
    return { bug_id: bugId, state: "NORMAL" };
}
