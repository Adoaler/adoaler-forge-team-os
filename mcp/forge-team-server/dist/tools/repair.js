import { z } from "zod";
import { classifyFailure, closeRepair, planRepair } from "../engine/selfHealing.js";
import { jsonResult } from "./helpers.js";
export function registerRepairTools(server, db) {
    server.registerTool("repair.plan", { description: "Plan a repair from a failure.", inputSchema: { failure: z.string(), affected_files: z.array(z.string()).optional() } }, async (args) => jsonResult(planRepair(db, args)));
    server.registerTool("repair.apply", { description: "Record a repair patch proposal; code mutation remains guarded by Codex edit approval.", inputSchema: { task_id: z.string().optional(), patch_summary: z.string(), affected_files: z.array(z.string()).optional() } }, async (args) => jsonResult({ recorded: true, ...args }));
    server.registerTool("repair.classify_failure", { description: "Classify a failure.", inputSchema: { failure: z.string() } }, async (args) => jsonResult({ category: classifyFailure(args.failure) }));
    server.registerTool("repair.find_similar_bug", { description: "Find similar bug by text.", inputSchema: { query: z.string(), limit: z.number().optional() } }, async (args) => jsonResult(db.all("SELECT * FROM bugs WHERE title LIKE ? OR symptoms LIKE ? OR category LIKE ? LIMIT ?", ["%" + args.query + "%", "%" + args.query + "%", "%" + args.query + "%", args.limit ?? 10])));
    server.registerTool("repair.create_patch_task", { description: "Create a repair task.", inputSchema: { failure: z.string(), affected_files: z.array(z.string()).optional() } }, async (args) => jsonResult(planRepair(db, args)));
    server.registerTool("repair.verify", { description: "Record repair verification request.", inputSchema: { gates: z.array(z.string()).optional() } }, async (args) => jsonResult({ gates: args.gates ?? ["typecheck", "test"], next: "Run quality.run_targeted with these gates." }));
    server.registerTool("repair.close", { description: "Close repair and save bug solution.", inputSchema: { title: z.string(), category: z.string(), symptoms: z.string(), fix_summary: z.string(), affected_files: z.array(z.string()).optional() } }, async (args) => jsonResult(closeRepair(db, args)));
}
