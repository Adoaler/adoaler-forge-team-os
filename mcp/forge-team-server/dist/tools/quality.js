import { z } from "zod";
import { runQuality } from "../engine/qualityMatrix.js";
import { jsonResult } from "./helpers.js";
export function registerQualityTools(server, db) {
    server.registerTool("quality.run", { description: "Run configured quality gates.", inputSchema: { gates: z.array(z.string()).optional(), task_id: z.string().optional() } }, async (args) => jsonResult(await runQuality(db, args.gates, args.task_id)));
    server.registerTool("quality.run_targeted", { description: "Run targeted gates.", inputSchema: { gates: z.array(z.string()), task_id: z.string().optional() } }, async (args) => jsonResult(await runQuality(db, args.gates, args.task_id)));
    server.registerTool("quality.read_failure", { description: "Read latest quality failure.", inputSchema: {} }, async () => jsonResult(db.get("SELECT * FROM quality_runs WHERE status='fail' ORDER BY created_at DESC LIMIT 1")));
    server.registerTool("quality.classify_failure", { description: "Classify latest failure.", inputSchema: { text: z.string() } }, async (args) => jsonResult({ failure: args.text, category: /TS\d+/.test(args.text) ? "type_error" : "test_failure" }));
    server.registerTool("quality.report", { description: "Read latest quality report.", inputSchema: {} }, async () => jsonResult(db.get("SELECT * FROM quality_runs ORDER BY created_at DESC LIMIT 1")));
    server.registerTool("quality.required_gates_for_task", { description: "Read gates for a task.", inputSchema: { task_id: z.string() } }, async (args) => jsonResult(db.get("SELECT id, quality_gates FROM tasks WHERE id = ?", [args.task_id])));
    server.registerTool("quality.required_gates_for_change", { description: "Read gates for a change.", inputSchema: { change_id: z.string() } }, async (args) => jsonResult({ change_id: args.change_id, gates: ["typecheck", "test", "build", "change_migration_check"] }));
}
