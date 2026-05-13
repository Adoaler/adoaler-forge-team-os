import { ForgeDatabase } from "../db/sqlite.js";
import { parseJsonArray, stringifyJson } from "../utils/json.js";
import { nowIso } from "../utils/validators.js";
import { id } from "./ids.js";

export interface TaskInput {
  project_id?: string;
  title: string;
  type: string;
  depends_on?: string[];
  blocked_by?: string[];
  allowed_files?: string[];
  forbidden_files?: string[];
  acceptance_criteria?: string[];
  quality_gates?: string[];
  required_agents?: string[];
  risk_level?: string;
  rollback_plan?: string;
  memory_context?: string[];
  expected_outputs?: string[];
  status?: string;
}

export function createTask(db: ForgeDatabase, input: TaskInput) {
  const taskId = id("task");
  const now = nowIso();
  db.run("INSERT INTO tasks (id, project_id, title, type, depends_on, blocked_by, allowed_files, forbidden_files, acceptance_criteria, quality_gates, required_agents, risk_level, rollback_plan, memory_context, expected_outputs, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
    taskId, input.project_id ?? null, input.title, input.type,
    stringifyJson(input.depends_on ?? []), stringifyJson(input.blocked_by ?? []),
    stringifyJson(input.allowed_files ?? []), stringifyJson(input.forbidden_files ?? []),
    stringifyJson(input.acceptance_criteria ?? []), stringifyJson(input.quality_gates ?? []),
    stringifyJson(input.required_agents ?? []), input.risk_level ?? "medium", input.rollback_plan ?? null,
    stringifyJson(input.memory_context ?? []), stringifyJson(input.expected_outputs ?? []), input.status ?? "planned", now, now
  ]);
  return getTask(db, taskId);
}

export function getTask(db: ForgeDatabase, taskId: string) {
  return db.get("SELECT * FROM tasks WHERE id = ?", [taskId]);
}

export function listReadyTasks(db: ForgeDatabase) {
  const tasks = db.all("SELECT * FROM tasks WHERE status IN ('planned','ready') ORDER BY created_at");
  const complete = new Set(db.all<{ id: string }>("SELECT id FROM tasks WHERE status = 'complete'").map((row) => row.id));
  return tasks.filter((task) => parseJsonArray(task.depends_on).every((dep) => typeof dep === "string" && complete.has(dep)));
}

export function nextTask(db: ForgeDatabase) {
  return listReadyTasks(db)[0] ?? null;
}

export function setTaskStatus(db: ForgeDatabase, taskId: string, status: string, reason?: string) {
  const now = nowIso();
  db.run("UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?", [status, now, taskId]);
  if (reason) {
    db.run("INSERT INTO decisions (id, topic, decision, reason, linked_task_id, created_at) VALUES (?, 'task.status', ?, ?, ?, ?)", [id("dec"), status, reason, taskId, now]);
  }
  return getTask(db, taskId);
}
