import { ForgeDatabase } from "../db/sqlite.js";
import { parseJsonArray } from "../utils/json.js";

export function compileContext(db: ForgeDatabase, input: { task_id?: string; query?: string; change_id?: string }) {
  const task = input.task_id ? db.get("SELECT * FROM tasks WHERE id = ?", [input.task_id]) : null;
  const decisions = db.all("SELECT topic, decision, reason, created_at FROM decisions ORDER BY created_at DESC LIMIT 10");
  const rules = db.all("SELECT rule, applies_to, severity FROM architecture_rules ORDER BY created_at DESC LIMIT 20");
  const files = task ? parseJsonArray(task.allowed_files).filter((item): item is string => typeof item === "string") : [];
  const bugs = db.all("SELECT title, category, symptoms, fix_summary FROM bugs ORDER BY updated_at DESC LIMIT 5");
  return {
    objective: task?.title ?? input.query ?? "Compile minimal Team OS context",
    task,
    relevant_decisions: decisions,
    architecture_rules: rules,
    relevant_files: files,
    previous_bugs: bugs,
    allowed_files: task ? parseJsonArray(task.allowed_files) : [],
    forbidden_files: task ? parseJsonArray(task.forbidden_files) : []
  };
}
