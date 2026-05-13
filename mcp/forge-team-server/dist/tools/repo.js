import { z } from "zod";
import { getFileState, updateFileState } from "../engine/fileStateMachine.js";
import { detectCycles, detectDuplicateSymbols, indexRepo, searchText } from "../engine/repoWorldModel.js";
import { jsonResult } from "./helpers.js";
export function registerRepoTools(server, db) {
    server.registerTool("repo.index", { description: "Index repository files, symbols, and imports.", inputSchema: {} }, async () => jsonResult(indexRepo(db)));
    server.registerTool("repo.search_text", { description: "Search indexed text files.", inputSchema: { query: z.string(), limit: z.number().optional() } }, async (args) => jsonResult(searchText(db, args.query, args.limit ?? 20)));
    server.registerTool("repo.search_symbol", { description: "Search indexed symbols.", inputSchema: { query: z.string(), limit: z.number().optional() } }, async (args) => jsonResult(db.all("SELECT * FROM symbols WHERE name LIKE ? ORDER BY name LIMIT ?", ["%" + args.query + "%", args.limit ?? 20])));
    server.registerTool("repo.read_module_map", { description: "Read module map.", inputSchema: {} }, async () => jsonResult(db.all("SELECT * FROM modules ORDER BY name")));
    server.registerTool("repo.detect_cycles", { description: "Detect dependency cycles.", inputSchema: {} }, async () => jsonResult(detectCycles(db)));
    server.registerTool("repo.impact_analysis", { description: "List files and tasks matching a query.", inputSchema: { query: z.string() } }, async (args) => jsonResult({ files: searchText(db, args.query, 20), tasks: db.all("SELECT * FROM tasks WHERE title LIKE ? LIMIT 20", ["%" + args.query + "%"]) }));
    server.registerTool("repo.get_file_state", { description: "Read file state.", inputSchema: { file_path: z.string() } }, async (args) => jsonResult(getFileState(db, args.file_path)));
    server.registerTool("repo.update_file_state", { description: "Update file state.", inputSchema: { file_path: z.string(), status: z.string().optional(), current_hash: z.string().optional(), last_completed_symbol: z.string().optional(), remaining_plan: z.string().optional() } }, async (args) => jsonResult(updateFileState(db, args)));
    server.registerTool("repo.get_public_api", { description: "Read exported symbols for a file or repo.", inputSchema: { file_path: z.string().optional() } }, async (args) => jsonResult(args.file_path ? db.all("SELECT * FROM symbols WHERE file_path = ? AND exported = 1", [args.file_path]) : db.all("SELECT * FROM symbols WHERE exported = 1 ORDER BY file_path, name")));
    server.registerTool("repo.detect_dead_code", { description: "Basic dead-code scan for unexported symbols.", inputSchema: {} }, async () => jsonResult(db.all("SELECT * FROM symbols WHERE exported = 0 ORDER BY file_path, name LIMIT 100")));
    server.registerTool("repo.detect_duplicate_symbols", { description: "Detect duplicate symbols.", inputSchema: {} }, async () => jsonResult(detectDuplicateSymbols(db)));
}
