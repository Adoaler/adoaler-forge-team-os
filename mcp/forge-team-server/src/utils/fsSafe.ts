import { existsSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { workspaceRoot } from "./paths.js";

export function resolveInsideWorkspace(inputPath: string): string {
  const root = workspaceRoot();
  const full = resolve(root, inputPath);
  const rel = relative(root, full);
  if (rel.startsWith("..") || rel === "" && full !== root || rel.includes("..\\")) {
    throw new Error("Path escapes workspace: " + inputPath);
  }
  return full;
}

export function safeReadText(inputPath: string, maxBytes = 1024 * 1024): string {
  const full = resolveInsideWorkspace(inputPath);
  if (!existsSync(full)) throw new Error("File does not exist: " + inputPath);
  const stat = statSync(full);
  if (!stat.isFile()) throw new Error("Path is not a file: " + inputPath);
  if (stat.size > maxBytes) throw new Error("File exceeds safe read limit: " + inputPath);
  return readFileSync(full, "utf8");
}
