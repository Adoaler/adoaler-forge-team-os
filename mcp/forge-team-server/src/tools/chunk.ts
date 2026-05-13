import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ForgeDatabase } from "../db/sqlite.js";
import { findSafeBoundary, validateChunk } from "../engine/chunkAssembler.js";
import { jsonResult } from "./helpers.js";

export function registerChunkTools(server: McpServer, db: ForgeDatabase) {
  server.registerTool("chunk.validate", { description: "Validate chunk syntax and duplicates.", inputSchema: { file_path: z.string(), content: z.string() } }, async (args) => jsonResult(validateChunk(args)));
  server.registerTool("chunk.assemble", { description: "Validate assembled content before write.", inputSchema: { file_path: z.string(), previous_content: z.string().optional(), chunk_content: z.string() } }, async (args) => jsonResult(validateChunk({ file_path: args.file_path, content: (args.previous_content ?? "") + args.chunk_content })));
  server.registerTool("chunk.detect_duplicates", { description: "Detect duplicate symbols/imports.", inputSchema: { file_path: z.string(), content: z.string() } }, async (args) => jsonResult(validateChunk(args)));
  server.registerTool("chunk.detect_api_change", { description: "Compare public API text.", inputSchema: { before: z.string(), after: z.string() } }, async (args) => jsonResult({ changed: args.before !== args.after, before_hash: args.before.length, after_hash: args.after.length }));
  server.registerTool("chunk.detect_syntax_error", { description: "Detect syntax errors.", inputSchema: { file_path: z.string(), content: z.string() } }, async (args) => jsonResult(validateChunk(args).syntax_errors));
  server.registerTool("chunk.find_safe_boundary", { description: "Find safe boundary.", inputSchema: { content: z.string() } }, async (args) => jsonResult(findSafeBoundary(args.content)));
  server.registerTool("chunk.summarize", { description: "Summarize chunk.", inputSchema: { content: z.string() } }, async (args) => jsonResult({ chars: args.content.length, lines: args.content.split("\n").length, hash_preview: args.content.slice(0, 120) }));
}
