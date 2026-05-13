import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ForgeDatabase } from "../db/sqlite.js";
import { findSafeBoundary } from "../engine/chunkAssembler.js";
import { getFileState, updateFileState } from "../engine/fileStateMachine.js";
import { markComplete, nextContinuation, resumePrompt, saveContinuation } from "../engine/continuationEngine.js";
import { jsonResult } from "./helpers.js";

export function registerContinuationTools(server: McpServer, db: ForgeDatabase) {
  const saveInput = { file_path: z.string(), current_hash: z.string(), last_completed_symbol: z.string().optional(), open_blocks: z.array(z.string()).optional(), imports_declared: z.array(z.string()).optional(), public_api_emitted: z.array(z.string()).optional(), remaining_plan: z.string(), critic_warnings: z.array(z.string()).optional(), tests_required: z.array(z.string()).optional() };
  server.registerTool("continuation.save", { description: "Save continuation record.", inputSchema: saveInput }, async (args) => jsonResult(saveContinuation(db, args)));
  server.registerTool("continuation.next", { description: "Get next continuation.", inputSchema: { file_path: z.string().optional() } }, async (args) => jsonResult(nextContinuation(db, args.file_path)));
  server.registerTool("continuation.resume_file", { description: "Build resume prompt context.", inputSchema: { file_path: z.string() } }, async (args) => jsonResult(resumePrompt(db, args.file_path)));
  server.registerTool("continuation.get_file_state", { description: "Get file state.", inputSchema: { file_path: z.string() } }, async (args) => jsonResult(getFileState(db, args.file_path)));
  server.registerTool("continuation.update_file_state", { description: "Update file state.", inputSchema: { file_path: z.string(), status: z.string().optional(), current_hash: z.string().optional(), remaining_plan: z.string().optional() } }, async (args) => jsonResult(updateFileState(db, args)));
  server.registerTool("continuation.safe_stop_point", { description: "Find safe stop point.", inputSchema: { content: z.string() } }, async (args) => jsonResult(findSafeBoundary(args.content)));
  server.registerTool("continuation.remaining_plan", { description: "Read remaining plan.", inputSchema: { file_path: z.string() } }, async (args) => jsonResult(nextContinuation(db, args.file_path)));
  server.registerTool("continuation.validate_resume_context", { description: "Validate resume context exists.", inputSchema: { file_path: z.string(), current_hash: z.string().optional() } }, async (args) => jsonResult({ valid: Boolean(nextContinuation(db, args.file_path)), state: getFileState(db, args.file_path), expected_hash: args.current_hash }));
  server.registerTool("continuation.mark_complete", { description: "Mark file continuation complete.", inputSchema: { file_path: z.string() } }, async (args) => jsonResult(markComplete(db, args.file_path)));
  server.registerTool("continuation.mark_partial", { description: "Mark file partial.", inputSchema: saveInput }, async (args) => jsonResult(saveContinuation(db, args)));
}
