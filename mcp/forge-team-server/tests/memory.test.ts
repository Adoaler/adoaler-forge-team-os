import { describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ForgeDatabase } from "../src/db/sqlite.js";
import { applyMigrations } from "../src/db/migrations.js";
import { searchMemory, writeMemory } from "../src/engine/memoryCore.js";

function db() { const d = new ForgeDatabase(join(mkdtempSync(join(tmpdir(), "forge-memory-")), "db.sqlite")); applyMigrations(d); return d; }

describe("memory core", () => {
  it("writes and searches decisions", () => {
    const store = db();
    const written = writeMemory(store, { kind: "decision", topic: "stack", content: "Use TypeScript strict", reason: "runtime contract" });
    expect(written.id).toMatch(/^dec_/);
    expect(searchMemory(store, "TypeScript")).toHaveLength(1);
    store.close();
  });
});
