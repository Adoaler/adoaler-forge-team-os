import { ForgeDatabase } from "../db/sqlite.js";
import { stringifyJson } from "../utils/json.js";
import { nowIso } from "../utils/validators.js";
import { id } from "./ids.js";
import { createTask } from "./taskGraph.js";

export function createChange(db: ForgeDatabase, input: { project_id?: string; user_request: string; old_requirement?: string; new_requirement: string; reason?: string; risk_level?: string }) {
  const changeId = id("chg");
  const now = nowIso();
  db.run("INSERT INTO change_requests (id, project_id, user_request, old_requirement, new_requirement, reason, risk_level, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'proposed', ?, ?)", [changeId, input.project_id ?? null, input.user_request, input.old_requirement ?? null, input.new_requirement, input.reason ?? null, input.risk_level ?? "medium", now, now]);
  db.run("UPDATE project_state SET value = 'CHANGE_REQUEST', updated_at = ? WHERE key = 'governor.state'", [now]);
  return db.get("SELECT * FROM change_requests WHERE id = ?", [changeId]);
}

export function impactAnalysis(db: ForgeDatabase, changeId: string) {
  const change = db.get<{ id: string; new_requirement: string }>("SELECT * FROM change_requests WHERE id = ?", [changeId]);
  if (!change) throw new Error("Change Request not found: " + changeId);
  const words = change.new_requirement.toLowerCase().split(/\W+/).filter((w) => w.length > 3).slice(0, 8);
  const affectedFiles = new Set<string>();
  for (const word of words) {
    for (const row of db.all<{ file_path: string }>("SELECT file_path FROM files WHERE file_path LIKE ? LIMIT 20", ["%" + word + "%"])) affectedFiles.add(row.file_path);
  }
  const affectedTasks = db.all("SELECT id, title FROM tasks WHERE status NOT IN ('complete','cancelled_by_change') LIMIT 50");
  const migration = "Update Project Brain, revise affected contracts, then migrate files in task order.";
  const now = nowIso();
  db.run("UPDATE change_requests SET status='analyzing', affected_files=?, affected_tasks=?, migration_plan=?, rollback_plan=?, updated_at=? WHERE id=?", [stringifyJson([...affectedFiles]), stringifyJson(affectedTasks), migration, "Revert change tasks and restore previous contracts from checkpoint.", now, changeId]);
  db.run("UPDATE project_state SET value = 'IMPACT_ANALYSIS', updated_at = ? WHERE key = 'governor.state'", [now]);
  return db.get("SELECT * FROM change_requests WHERE id = ?", [changeId]);
}

export function createMigrationTasks(db: ForgeDatabase, changeId: string) {
  const change = db.get<{ id: string; new_requirement: string; affected_files: string; risk_level: string }>("SELECT * FROM change_requests WHERE id = ?", [changeId]);
  if (!change) throw new Error("Change Request not found: " + changeId);
  const task = createTask(db, {
    title: "Migrate after change request " + changeId,
    type: "migration",
    allowed_files: JSON.parse(change.affected_files || "[]") as string[],
    acceptance_criteria: ["Project Brain updated", "Affected tests updated", "Quality gates pass"],
    quality_gates: ["typecheck", "test", "build"],
    risk_level: change.risk_level,
    status: "ready"
  });
  return { change_id: changeId, tasks: [task] };
}
