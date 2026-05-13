import { describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ForgeDatabase } from "../src/db/sqlite.js";
import { applyMigrations } from "../src/db/migrations.js";
import { review } from "../src/engine/criticDaemon.js";
import { getGovernorState } from "../src/engine/vetoGovernor.js";

function db() { const d = new ForgeDatabase(join(mkdtempSync(join(tmpdir(), "forge-critic-")), "db.sqlite")); applyMigrations(d); return d; }

describe("critic", () => {
  it("rejects primary deferred-work content and enters repair mode", () => {
    const store = db();
    const marker = "T" + "ODO";
    const report = review(store, { scope: "inline", target: "file.ts", content: "export const x = 1; // " + marker + " fix" });
    expect(report.verdict).toBe("reject");
    expect(getGovernorState(store)).toBe("REPAIR_ONLY");
    store.close();
  });
});
