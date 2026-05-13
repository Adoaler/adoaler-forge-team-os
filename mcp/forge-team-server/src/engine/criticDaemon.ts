import { ForgeDatabase } from "../db/sqlite.js";
import { nowIso } from "../utils/validators.js";
import { id } from "./ids.js";

export interface CriticInput {
  project_id?: string;
  scope: "pre" | "inline" | "file" | "module" | "system";
  target: string;
  content?: string;
}

export function review(db: ForgeDatabase, input: CriticInput) {
  const blocking: string[] = [];
  const notes: string[] = [];
  const text = input.content ?? "";
  if (/T[O]DO\b/.test(text)) blocking.push("deferred-work marker in primary content");
  if (/placeholder|stub|fake implementation/i.test(text)) blocking.push("Misleading placeholder or fake implementation wording");
  if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(text)) blocking.push("Swallowed error block");
  if (/process\.env\.[A-Z0-9_]*(TOKEN|SECRET|KEY|PASSWORD)/.test(text)) notes.push("Reads sensitive environment variable; verify it is not logged or persisted");
  const score = Math.max(0, 100 - blocking.length * 40 - notes.length * 5);
  const verdict = blocking.length > 0 ? "reject" : notes.length > 0 ? "approve_with_notes" : "approve";
  const risk = blocking.length > 1 ? "critical" : blocking.length === 1 ? "high" : notes.length ? "medium" : "low";
  const report = { score, verdict, blocking_issues: blocking, non_blocking_issues: notes, required_fix_tasks: blocking.map((issue) => ({ title: "Fix critic issue: " + issue, target: input.target })), memory_updates: [], risk_level: risk };
  const reportId = id("crit");
  db.run("INSERT INTO critic_reports (id, project_id, scope, target, score, verdict, blocking_issues, non_blocking_issues, required_fix_tasks, memory_updates, risk_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [reportId, input.project_id ?? null, input.scope, input.target, score, verdict, JSON.stringify(blocking), JSON.stringify(notes), JSON.stringify(report.required_fix_tasks), "[]", risk, nowIso()]);
  if (verdict === "reject") db.run("UPDATE project_state SET value = 'REPAIR_ONLY', updated_at = ? WHERE key = 'governor.state'", [nowIso()]);
  return { id: reportId, ...report };
}

export function latestReport(db: ForgeDatabase) {
  return db.get("SELECT * FROM critic_reports ORDER BY created_at DESC LIMIT 1") ?? null;
}
