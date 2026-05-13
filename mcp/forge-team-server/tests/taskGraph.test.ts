import { describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ForgeDatabase } from "../src/db/sqlite.js";
import { applyMigrations } from "../src/db/migrations.js";
import { createTask, listReadyTasks, setTaskStatus } from "../src/engine/taskGraph.js";

function db() { const d = new ForgeDatabase(join(mkdtempSync(join(tmpdir(), "forge-task-")), "db.sqlite")); applyMigrations(d); return d; }

describe("task graph", () => {
  it("blocks dependent tasks until dependencies complete", () => {
    const store = db();
    const a = createTask(store, { title: "A", type: "build", status: "ready" }) as { id: string };
    createTask(store, { title: "B", type: "build", depends_on: [a.id], status: "ready" });
    expect(listReadyTasks(store)).toHaveLength(1);
    setTaskStatus(store, a.id, "complete");
    expect(listReadyTasks(store)).toHaveLength(1);
    store.close();
  });
});
