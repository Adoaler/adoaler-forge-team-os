import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { workspaceRoot } from "./paths.js";

const allowedNpmScripts = new Set(["format", "lint", "typecheck", "test", "build"]);

export interface ProcessResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
}

export function hasNpmScript(script: string, cwd = workspaceRoot()): boolean {
  if (!allowedNpmScripts.has(script)) return false;
  const pkgPath = resolve(cwd, "package.json");
  if (!existsSync(pkgPath)) return false;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { scripts?: Record<string, string> };
  return Boolean(pkg.scripts?.[script]);
}

export function runNpmScript(script: string, cwd = workspaceRoot(), timeoutMs = 120000): Promise<ProcessResult> {
  if (!hasNpmScript(script, cwd)) {
    return Promise.resolve({ command: "npm run " + script, exitCode: 127, stdout: "", stderr: "Script is not allowlisted or missing: " + script });
  }
  return new Promise((resolvePromise) => {
    const child = spawn("npm", ["run", script], { cwd, shell: process.platform === "win32" });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      stderr += "\nProcess timed out";
    }, timeoutMs);
    child.stdout.on("data", (data: Buffer) => { stdout += data.toString("utf8"); });
    child.stderr.on("data", (data: Buffer) => { stderr += data.toString("utf8"); });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolvePromise({ command: "npm run " + script, exitCode: code ?? 1, stdout, stderr });
    });
  });
}
