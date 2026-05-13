import { describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ForgeDatabase } from "../src/db/sqlite.js";
import { applyMigrations } from "../src/db/migrations.js";
import { createChange, createMigrationTasks, impactAnalysis } from "../src/engine/changeManager.js";

function db() { const d = new ForgeDatabase(join(mkdtempSync(join(tmpdir(), "forge-change-")), "db.sqlite")); applyMigrations(d); return d; }

describe("change manager", () => {
  it("creates impact analysis and migration tasks", () => {
    const store = db();
    const change = createChange(store, { user_request: "change auth flow", new_requirement: "Use passwordless auth flow" }) as { id: string };
    expect(impactAnalysis(store, change.id)).toBeTruthy();
    expect(createMigrationTasks(store, change.id).tasks).toHaveLength(1);
    store.close();
  });
});
