import { z } from "zod";
import { searchMemory, writeMemory } from "../engine/memoryCore.js";
import { jsonResult } from "./helpers.js";
export function registerMemoryTools(server, db) {
    server.registerTool("memory.search", { description: "Search SQLite LTM decisions and bugs.", inputSchema: { query: z.string(), limit: z.number().optional() } }, async (args) => jsonResult(searchMemory(db, args.query, args.limit ?? 20)));
    server.registerTool("memory.write", { description: "Write a decision, bug, risk, limitation, or design memory.", inputSchema: { kind: z.string(), topic: z.string(), content: z.string(), reason: z.string().optional(), task_id: z.string().optional(), project_id: z.string().optional() } }, async (args) => jsonResult(writeMemory(db, args)));
    server.registerTool("memory.update", { description: "Append an update decision to LTM.", inputSchema: { topic: z.string(), content: z.string(), reason: z.string().optional() } }, async (args) => jsonResult(writeMemory(db, { kind: "decision", topic: args.topic, content: args.content, reason: args.reason })));
    server.registerTool("memory.link", { description: "Link memory through a decision record.", inputSchema: { source_id: z.string(), target_id: z.string(), relation: z.string() } }, async (args) => jsonResult(writeMemory(db, { kind: "decision", topic: "memory.link", content: JSON.stringify(args), reason: "memory linkage" })));
    server.registerTool("memory.summarize", { description: "Summarize recent LTM entries.", inputSchema: { limit: z.number().optional() } }, async (args) => jsonResult({ entries: searchMemory(db, "", args.limit ?? 20) }));
    server.registerTool("memory.summarize_project_state", { description: "Summarize persisted project state.", inputSchema: {} }, async () => jsonResult(db.all("SELECT key, value, updated_at FROM project_state ORDER BY key")));
    server.registerTool("memory.get_decisions", { description: "Read recent decisions.", inputSchema: { limit: z.number().optional() } }, async (args) => jsonResult(db.all("SELECT * FROM decisions ORDER BY created_at DESC LIMIT ?", [args.limit ?? 20])));
    server.registerTool("memory.get_recent_bugs", { description: "Read recent bugs.", inputSchema: { limit: z.number().optional() } }, async (args) => jsonResult(db.all("SELECT * FROM bugs ORDER BY updated_at DESC LIMIT ?", [args.limit ?? 20])));
    server.registerTool("memory.get_project_state", { description: "Read project state key-values.", inputSchema: {} }, async () => jsonResult(db.all("SELECT key, value, updated_at FROM project_state ORDER BY key")));
}
