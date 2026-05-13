import { z } from "zod";
import { checkpoint, verifyReady } from "../engine/releaseGovernor.js";
import { jsonResult } from "./helpers.js";
export function registerReleaseTools(server, db) {
    server.registerTool("release.checkpoint", { description: "Create release checkpoint.", inputSchema: { label: z.string() } }, async (args) => jsonResult(checkpoint(db, args.label)));
    server.registerTool("release.compare_checkpoints", { description: "Compare two checkpoints.", inputSchema: { before_id: z.string(), after_id: z.string() } }, async (args) => jsonResult({ before: db.get("SELECT * FROM checkpoints WHERE id=?", [args.before_id]), after: db.get("SELECT * FROM checkpoints WHERE id=?", [args.after_id]) }));
    server.registerTool("release.prepare_notes", { description: "Prepare release notes.", inputSchema: { version: z.string() } }, async (args) => jsonResult({ version: args.version, completed_tasks: db.all("SELECT id, title FROM tasks WHERE status='complete' ORDER BY updated_at DESC LIMIT 50") }));
    server.registerTool("release.verify_ready", { description: "Verify release readiness.", inputSchema: {} }, async () => jsonResult(verifyReady(db)));
    server.registerTool("release.block", { description: "Block release.", inputSchema: { reason: z.string() } }, async (args) => jsonResult({ ready: false, reason: args.reason }));
    server.registerTool("release.mark_ready", { description: "Mark release ready if gates are clear.", inputSchema: {} }, async () => { const ready = verifyReady(db); if (ready.ready)
        db.run("UPDATE project_state SET value='RELEASE_READY' WHERE key='governor.state'"); return jsonResult(ready); });
}
