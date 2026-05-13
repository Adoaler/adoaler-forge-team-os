import { describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ForgeDatabase } from "../src/db/sqlite.js";
import { applyMigrations } from "../src/db/migrations.js";
import { nextContinuation, resumePrompt, saveContinuation } from "../src/engine/continuationEngine.js";

function db() { const d = new ForgeDatabase(join(mkdtempSync(join(tmpdir(), "forge-cont-")), "db.sqlite")); applyMigrations(d); return d; }

describe("continuation", () => {
  it("saves resumable file state", () => {
    const store = db();
    saveContinuation(store, { file_path: "src/a.ts", current_hash: "abc", last_completed_symbol: "A", remaining_plan: "finish B" });
    expect(nextContinuation(store, "src/a.ts")).toBeTruthy();
    expect(resumePrompt(store, "src/a.ts").instructions).toContain("do not rewrite previous content");
    store.close();
  });
});
