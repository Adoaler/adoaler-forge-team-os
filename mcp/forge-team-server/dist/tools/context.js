import { z } from "zod";
import { compileContext } from "../engine/contextCompiler.js";
import { jsonResult } from "./helpers.js";
export function registerContextTools(server, db) {
    server.registerTool("context.compile", { description: "Compile minimal task context.", inputSchema: { task_id: z.string().optional(), query: z.string().optional(), change_id: z.string().optional() } }, async (args) => jsonResult(compileContext(db, args)));
    server.registerTool("context.compress_module", { description: "Compress module context.", inputSchema: { module_id: z.string().optional(), module_name: z.string().optional() } }, async (args) => jsonResult({ module: args, files: db.all("SELECT file_path, status, current_hash FROM files LIMIT 50") }));
    server.registerTool("context.explain_missing_info", { description: "Explain missing context.", inputSchema: { task_id: z.string().optional() } }, async (args) => jsonResult({ missing: args.task_id ? [] : ["task_id"], recommendation: "Create or select a graph task before implementation." }));
    server.registerTool("context.select_relevant_files", { description: "Select relevant files by query.", inputSchema: { query: z.string(), limit: z.number().optional() } }, async (args) => jsonResult(db.all("SELECT file_path, status FROM files WHERE file_path LIKE ? LIMIT ?", ["%" + args.query + "%", args.limit ?? 20])));
    server.registerTool("context.get_task_context", { description: "Compile context for a task.", inputSchema: { task_id: z.string() } }, async (args) => jsonResult(compileContext(db, { task_id: args.task_id })));
    server.registerTool("context.get_change_context", { description: "Compile context for a change.", inputSchema: { change_id: z.string() } }, async (args) => jsonResult({ change: db.get("SELECT * FROM change_requests WHERE id = ?", [args.change_id]), context: compileContext(db, { change_id: args.change_id }) }));
    server.registerTool("context.get_repair_context", { description: "Compile context for repair mode.", inputSchema: {} }, async () => jsonResult({ state: db.get("SELECT * FROM project_state WHERE key='governor.state'"), latest_quality: db.get("SELECT * FROM quality_runs ORDER BY created_at DESC LIMIT 1"), latest_critic: db.get("SELECT * FROM critic_reports ORDER BY created_at DESC LIMIT 1") }));
}
