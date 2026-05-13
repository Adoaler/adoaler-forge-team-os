import { z } from "zod";
import { createChange, createMigrationTasks, impactAnalysis } from "../engine/changeManager.js";
import { compareTextRequirements } from "../engine/impactAnalyzer.js";
import { jsonResult } from "./helpers.js";
export function registerChangeTools(server, db) {
    server.registerTool("change.create", { description: "Create a Change Request and enter CHANGE_REQUEST mode.", inputSchema: { user_request: z.string(), old_requirement: z.string().optional(), new_requirement: z.string(), reason: z.string().optional(), risk_level: z.string().optional() } }, async (args) => jsonResult(createChange(db, args)));
    server.registerTool("change.compare_requirements", { description: "Compare old vs new requirement.", inputSchema: { old_requirement: z.string().optional(), new_requirement: z.string() } }, async (args) => jsonResult(compareTextRequirements(args.old_requirement, args.new_requirement)));
    server.registerTool("change.impact_analysis", { description: "Run impact analysis.", inputSchema: { change_id: z.string() } }, async (args) => jsonResult(impactAnalysis(db, args.change_id)));
    server.registerTool("change.approve_plan", { description: "Approve a change plan.", inputSchema: { change_id: z.string() } }, async (args) => { db.run("UPDATE change_requests SET status='approved' WHERE id=?", [args.change_id]); return jsonResult(db.get("SELECT * FROM change_requests WHERE id=?", [args.change_id])); });
    server.registerTool("change.reject", { description: "Reject a change.", inputSchema: { change_id: z.string() } }, async (args) => { db.run("UPDATE change_requests SET status='rejected' WHERE id=?", [args.change_id]); return jsonResult({ change_id: args.change_id, status: "rejected" }); });
    server.registerTool("change.update_project_brain", { description: "Record Project Brain update requirement.", inputSchema: { change_id: z.string(), summary: z.string() } }, async (args) => jsonResult({ change_id: args.change_id, summary: args.summary, action: "Update Project Brain files before code changes." }));
    server.registerTool("change.update_task_graph", { description: "Create migration task graph nodes.", inputSchema: { change_id: z.string() } }, async (args) => jsonResult(createMigrationTasks(db, args.change_id)));
    server.registerTool("change.create_migration_tasks", { description: "Create migration tasks.", inputSchema: { change_id: z.string() } }, async (args) => jsonResult(createMigrationTasks(db, args.change_id)));
    server.registerTool("change.rollback", { description: "Mark change rolled back.", inputSchema: { change_id: z.string() } }, async (args) => { db.run("UPDATE change_requests SET status='rolled_back' WHERE id=?", [args.change_id]); return jsonResult({ change_id: args.change_id, status: "rolled_back" }); });
    server.registerTool("change.complete", { description: "Complete change.", inputSchema: { change_id: z.string() } }, async (args) => { db.run("UPDATE change_requests SET status='completed' WHERE id=?", [args.change_id]); return jsonResult({ change_id: args.change_id, status: "completed" }); });
}
