import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { fileURLToPath } from "node:url";
import { ForgeDatabase } from "./db/sqlite.js";
import { applyMigrations } from "./db/migrations.js";
import { registerMemoryTools } from "./tools/memory.js";
import { registerRepoTools } from "./tools/repo.js";
import { registerTaskTools } from "./tools/task.js";
import { registerContextTools } from "./tools/context.js";
import { registerContinuationTools } from "./tools/continuation.js";
import { registerChunkTools } from "./tools/chunk.js";
import { registerCriticTools } from "./tools/critic.js";
import { registerQualityTools } from "./tools/quality.js";
import { registerRepairTools } from "./tools/repair.js";
import { registerReleaseTools } from "./tools/release.js";
import { registerChangeTools } from "./tools/change.js";
import { registerArchitectureTools } from "./tools/architecture.js";
import { log } from "./utils/logger.js";
export function createServer(db = new ForgeDatabase()) {
    applyMigrations(db);
    const server = new McpServer({ name: "adoaler-forge-team-os", version: "0.1.0" });
    registerMemoryTools(server, db);
    registerRepoTools(server, db);
    registerTaskTools(server, db);
    registerContextTools(server, db);
    registerContinuationTools(server, db);
    registerChunkTools(server, db);
    registerCriticTools(server, db);
    registerQualityTools(server, db);
    registerRepairTools(server, db);
    registerReleaseTools(server, db);
    registerChangeTools(server, db);
    registerArchitectureTools(server, db);
    return { server, db };
}
async function main() {
    const { server } = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log("MCP server connected over stdio");
}
if (fileURLToPath(import.meta.url) === process.argv[1]) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
