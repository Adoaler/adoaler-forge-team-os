import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const failures = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist"].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(ts|json|md)$/.test(entry.name)) {
      const text = readFileSync(path, "utf8");
      const deferredWorkPattern = new RegExp("T" + "ODO\\b");
      if (deferredWorkPattern.test(text)) failures.push(path + " contains deferred-work marker");
      if (/\.only\(/.test(text)) failures.push(path + " contains focused test");
    }
  }
}
walk(root);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("lint passed");
