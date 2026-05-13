import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ForgeDatabase } from "../db/sqlite.js";
import { review, latestReport } from "../engine/criticDaemon.js";
import { createTask } from "../engine/taskGraph.js";
import { jsonResult } from "./helpers.js";

export function registerCriticTools(server: McpServer, db: ForgeDatabase) {
  const input = { target: z.string(), content: z.string().optional(), project_id: z.string().optional() };
  server.registerTool("critic.pre_review", { description: "Pre-implementation critic.", inputSchema: input }, async (args) => jsonResult(review(db, { ...args, scope: "pre" })));
  server.registerTool("critic.inline_review", { description: "Inline chunk critic.", inputSchema: input }, async (args) => jsonResult(review(db, { ...args, scope: "inline" })));
  server.registerTool("critic.file_review", { description: "File critic.", inputSchema: input }, async (args) => jsonResult(review(db, { ...args, scope: "file" })));
  server.registerTool("critic.module_review", { description: "Module critic.", inputSchema: input }, async (args) => jsonResult(review(db, { ...args, scope: "module" })));
  server.registerTool("critic.system_review", { description: "System critic.", inputSchema: input }, async (args) => jsonResult(review(db, { ...args, scope: "system" })));
  server.registerTool("critic.create_fix_tasks", { description: "Create fix tasks from latest critic report.", inputSchema: {} }, async () => { const report = latestReport(db) as { blocking_issues?: string } | null; const issues = report?.blocking_issues ? JSON.parse(report.blocking_issues) as string[] : []; return jsonResult(issues.map((issue) => createTask(db, { title: "Fix critic issue: " + issue, type: "repair", status: "ready", quality_gates: ["typecheck", "test"], risk_level: "high" }))); });
  server.registerTool("critic.get_latest_report", { description: "Read latest critic report.", inputSchema: {} }, async () => jsonResult(latestReport(db)));
}
