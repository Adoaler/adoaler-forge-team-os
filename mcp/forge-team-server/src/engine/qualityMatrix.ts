import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ForgeDatabase } from "../db/sqlite.js";
import { runNpmScript } from "../utils/processRunner.js";
import { workspaceRoot } from "../utils/paths.js";
import { nowIso } from "../utils/validators.js";
import { id } from "./ids.js";
import { detectCycles } from "./repoWorldModel.js";

const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/,
  /(api[_-]?key|token|secret|password)\s*[:=]\s*['\"][^'\"]{8,}/i
];

export function secretScanText(text: string) {
  return secretPatterns.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
}

export async function runQuality(db: ForgeDatabase, gates: string[] = ["typecheck", "test", "build"], taskId?: string) {
  const failed: string[] = [];
  const logs: string[] = [];
  for (const gate of gates) {
    if (gate === "secret_scan") {
      const pkg = resolve(workspaceRoot(), "package.json");
      const matches = existsSync(pkg) ? secretScanText(readFileSync(pkg, "utf8")) : [];
      if (matches.length) failed.push(gate);
      logs.push("secret_scan patterns=" + matches.length);
    } else if (gate === "circular_dependency") {
      const cycles = detectCycles(db);
      if (cycles.cycles.length) failed.push(gate);
      logs.push("circular_dependency checked_edges=" + cycles.checked_edges);
    } else if (["format", "lint", "typecheck", "test", "build"].includes(gate)) {
      const result = await runNpmScript(gate);
      if (result.exitCode !== 0) failed.push(gate);
      logs.push(gate + " exit=" + result.exitCode + " " + (result.stderr || result.stdout).slice(0, 800));
    } else {
      logs.push(gate + " recorded as informational gate");
    }
  }
  const report = {
    status: failed.length ? "fail" : "pass",
    failed_gates: failed,
    logs_summary: logs.join("\n").slice(0, 4000),
    suspected_causes: failed.map((gate) => "Gate failed: " + gate),
    recommended_repair_tasks: failed.map((gate) => ({ title: "Repair failing gate: " + gate, gate }))
  };
  db.run("INSERT INTO quality_runs (id, task_id, status, failed_gates, logs_summary, suspected_causes, recommended_repair_tasks, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [id("qual"), taskId ?? null, report.status, JSON.stringify(report.failed_gates), report.logs_summary, JSON.stringify(report.suspected_causes), JSON.stringify(report.recommended_repair_tasks), nowIso()]);
  return report;
}
