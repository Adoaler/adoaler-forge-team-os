import { z } from "zod";
import { nowIso } from "../utils/validators.js";
import { id } from "../engine/ids.js";
import { jsonResult } from "./helpers.js";
export function registerArchitectureTools(server, db) {
    server.registerTool("governor.get_state", { description: "Read governor state.", inputSchema: {} }, async () => jsonResult(db.get("SELECT value AS state FROM project_state WHERE key='governor.state'")));
    server.registerTool("governor.set_state", { description: "Set governor state.", inputSchema: { state: z.string() } }, async (args) => { db.run("UPDATE project_state SET value=?, updated_at=? WHERE key='governor.state'", [args.state, nowIso()]); return jsonResult({ state: args.state }); });
    server.registerTool("governor.check", { description: "Check governor vetoes.", inputSchema: {} }, async () => { const { governorCheck } = await import("../engine/vetoGovernor.js"); return jsonResult(governorCheck(db)); });
    server.registerTool("governor.veto", { description: "Record veto.", inputSchema: { reason: z.string() } }, async (args) => { db.run("UPDATE project_state SET value='BLOCKED', updated_at=? WHERE key='governor.state'", [nowIso()]); db.run("INSERT INTO decisions (id, topic, decision, reason, created_at) VALUES (?, 'governor.veto', 'BLOCKED', ?, ?)", [id("dec"), args.reason, nowIso()]); return jsonResult({ state: "BLOCKED", reason: args.reason }); });
    server.registerTool("governor.allow", { description: "Return to NORMAL.", inputSchema: { reason: z.string().optional() } }, async (args) => { db.run("UPDATE project_state SET value='NORMAL', updated_at=? WHERE key='governor.state'", [nowIso()]); return jsonResult({ state: "NORMAL", reason: args.reason ?? "allowed" }); });
    server.registerTool("governor.require_repair", { description: "Enter REPAIR_ONLY.", inputSchema: { reason: z.string() } }, async (args) => { db.run("UPDATE project_state SET value='REPAIR_ONLY', updated_at=? WHERE key='governor.state'", [nowIso()]); return jsonResult({ state: "REPAIR_ONLY", reason: args.reason }); });
    server.registerTool("governor.require_change_analysis", { description: "Enter IMPACT_ANALYSIS.", inputSchema: { reason: z.string() } }, async (args) => { db.run("UPDATE project_state SET value='IMPACT_ANALYSIS', updated_at=? WHERE key='governor.state'", [nowIso()]); return jsonResult({ state: "IMPACT_ANALYSIS", reason: args.reason }); });
}
