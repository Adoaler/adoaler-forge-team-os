import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ForgeDatabase } from "../db/sqlite.js";
import { createTask, getTask, listReadyTasks, nextTask, setTaskStatus } from "../engine/taskGraph.js";
import { jsonResult } from "./helpers.js";

const taskInput = { title: z.string(), type: z.string(), depends_on: z.array(z.string()).optional(), blocked_by: z.array(z.string()).optional(), allowed_files: z.array(z.string()).optional(), forbidden_files: z.array(z.string()).optional(), acceptance_criteria: z.array(z.string()).optional(), quality_gates: z.array(z.string()).optional(), required_agents: z.array(z.string()).optional(), risk_level: z.string().optional(), rollback_plan: z.string().optional(), expected_outputs: z.array(z.string()).optional(), status: z.string().optional() };

export function registerTaskTools(server: McpServer, db: ForgeDatabase) {
  server.registerTool("task.create", { description: "Create a graph task.", inputSchema: taskInput }, async (args) => jsonResult(createTask(db, args)));
  server.registerTool("task.expand", { description: "Create multiple child tasks.", inputSchema: { parent_id: z.string().optional(), tasks: z.array(z.object(taskInput)) } }, async (args) => jsonResult(args.tasks.map((task) => createTask(db, { ...task, depends_on: args.parent_id ? [args.parent_id, ...(task.depends_on ?? [])] : task.depends_on }))));
  server.registerTool("task.next", { description: "Read next ready task.", inputSchema: {} }, async () => jsonResult(nextTask(db)));
  server.registerTool("task.block", { description: "Block a task.", inputSchema: { id: z.string(), reason: z.string().optional() } }, async (args) => jsonResult(setTaskStatus(db, args.id, "blocked", args.reason)));
  server.registerTool("task.complete", { description: "Complete a task.", inputSchema: { id: z.string(), reason: z.string().optional() } }, async (args) => jsonResult(setTaskStatus(db, args.id, "complete", args.reason)));
  server.registerTool("task.reject", { description: "Reject a task.", inputSchema: { id: z.string(), reason: z.string().optional() } }, async (args) => jsonResult(setTaskStatus(db, args.id, "rejected", args.reason)));
  server.registerTool("task.cancel", { description: "Cancel a task because of a change.", inputSchema: { id: z.string(), reason: z.string().optional() } }, async (args) => jsonResult(setTaskStatus(db, args.id, "cancelled_by_change", args.reason)));
  server.registerTool("task.list_ready", { description: "List ready tasks.", inputSchema: {} }, async () => jsonResult(listReadyTasks(db)));
  server.registerTool("task.get_context", { description: "Get task record.", inputSchema: { id: z.string() } }, async (args) => jsonResult(getTask(db, args.id)));
  server.registerTool("task.update_after_change", { description: "Move affected tasks after change.", inputSchema: { task_ids: z.array(z.string()), status: z.string().default("cancelled_by_change") } }, async (args) => jsonResult(args.task_ids.map((taskId) => setTaskStatus(db, taskId, args.status, "updated after change"))));
  server.registerTool("task.create_repair_task", { description: "Create repair task.", inputSchema: { title: z.string(), affected_files: z.array(z.string()).optional() } }, async (args) => jsonResult(createTask(db, { title: args.title, type: "repair", allowed_files: args.affected_files ?? [], quality_gates: ["typecheck", "test"], status: "ready", risk_level: "high" })));
  server.registerTool("task.create_migration_task", { description: "Create migration task.", inputSchema: { title: z.string(), affected_files: z.array(z.string()).optional() } }, async (args) => jsonResult(createTask(db, { title: args.title, type: "migration", allowed_files: args.affected_files ?? [], quality_gates: ["typecheck", "test", "build"], status: "ready", risk_level: "high" })));
}
