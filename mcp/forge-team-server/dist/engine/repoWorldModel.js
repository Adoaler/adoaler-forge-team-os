import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, relative, resolve } from "node:path";
import ts from "typescript";
import { sha256Text } from "../utils/hash.js";
import { workspaceRoot } from "../utils/paths.js";
import { nowIso } from "../utils/validators.js";
import { id } from "./ids.js";
const ignored = new Set([".git", "node_modules", "dist", ".forge-team", ".codex"]);
const textExt = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".toml", ".yml", ".yaml", ".sh", ".ps1", ".html", ".css"]);
function listFiles(dir, out = []) {
    if (!existsSync(dir))
        return out;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (ignored.has(entry.name))
            continue;
        const full = resolve(dir, entry.name);
        if (entry.isDirectory())
            listFiles(full, out);
        else if (entry.isFile() && textExt.has(extname(entry.name).toLowerCase()))
            out.push(full);
    }
    return out;
}
export function extractSymbols(filePath, text) {
    const ext = extname(filePath).toLowerCase();
    if (![".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(ext))
        return [];
    const source = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true);
    const result = [];
    function hasExport(node) {
        return ts.canHaveModifiers(node) && Boolean(ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword));
    }
    function visit(node) {
        if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) && node.name) {
            result.push({ name: node.name.text, kind: ts.SyntaxKind[node.kind], exported: hasExport(node), signature: node.getText(source).split("{")[0]?.slice(0, 500) });
        }
        ts.forEachChild(node, visit);
    }
    visit(source);
    return result;
}
export function extractImports(filePath, text) {
    const ext = extname(filePath).toLowerCase();
    if (![".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(ext))
        return [];
    const source = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true);
    const imports = [];
    for (const stmt of source.statements) {
        if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier))
            imports.push(stmt.moduleSpecifier.text);
        if (ts.isExportDeclaration(stmt) && stmt.moduleSpecifier && ts.isStringLiteral(stmt.moduleSpecifier))
            imports.push(stmt.moduleSpecifier.text);
    }
    return imports;
}
export function indexRepo(db, root = workspaceRoot()) {
    const now = nowIso();
    const files = listFiles(root);
    let symbolCount = 0;
    db.run("DELETE FROM dependencies WHERE project_id IS NULL");
    for (const full of files) {
        const rel = relative(root, full).replace(/\\/g, "/");
        const text = readFileSync(full, "utf8");
        const hash = sha256Text(text);
        db.run("INSERT INTO files (file_path, status, current_hash, imports_declared, public_api_emitted, updated_at) VALUES (?, COALESCE((SELECT status FROM files WHERE file_path = ?), 'planned'), ?, ?, ?, ?) ON CONFLICT(file_path) DO UPDATE SET current_hash=excluded.current_hash, imports_declared=excluded.imports_declared, public_api_emitted=excluded.public_api_emitted, updated_at=excluded.updated_at", [rel, rel, hash, JSON.stringify(extractImports(rel, text)), JSON.stringify([]), now]);
        db.run("DELETE FROM symbols WHERE file_path = ?", [rel]);
        for (const sym of extractSymbols(rel, text)) {
            db.run("INSERT INTO symbols (id, file_path, name, kind, exported, signature, hash, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [id("sym"), rel, sym.name, sym.kind, sym.exported ? 1 : 0, sym.signature ?? null, sha256Text(sym.name + sym.kind + (sym.signature ?? "")), now]);
            symbolCount++;
        }
        for (const spec of extractImports(rel, text)) {
            db.run("INSERT INTO dependencies (id, from_file, to_file, allowed, updated_at) VALUES (?, ?, ?, 1, ?)", [id("dep"), rel, spec, now]);
        }
    }
    return { indexed_files: files.length, indexed_symbols: symbolCount, root };
}
export function searchText(db, query, limit = 20) {
    const root = workspaceRoot();
    const hits = [];
    for (const row of db.all("SELECT file_path FROM files ORDER BY file_path")) {
        const full = resolve(root, row.file_path);
        if (!existsSync(full) || statSync(full).size > 1024 * 1024)
            continue;
        const lines = readFileSync(full, "utf8").split("\n");
        for (let i = 0; i < lines.length; i++) {
            if (lines[i]?.toLowerCase().includes(query.toLowerCase()))
                hits.push({ file_path: row.file_path, line: i + 1, preview: (lines[i] ?? "").trim().slice(0, 240) });
            if (hits.length >= limit)
                return hits;
        }
    }
    return hits;
}
export function detectDuplicateSymbols(db) {
    return db.all("SELECT name, kind, COUNT(*) AS count, GROUP_CONCAT(file_path) AS files FROM symbols GROUP BY name, kind HAVING COUNT(*) > 1 ORDER BY count DESC");
}
export function detectCycles(db) {
    const rows = db.all("SELECT from_file, to_file FROM dependencies WHERE from_file IS NOT NULL AND to_file IS NOT NULL");
    const edges = new Map();
    for (const row of rows) {
        if (!row.to_file.startsWith("."))
            continue;
        const arr = edges.get(row.from_file) ?? [];
        arr.push(row.to_file);
        edges.set(row.from_file, arr);
    }
    return { cycles: [], checked_edges: rows.length, note: "Relative import graph captured; file resolution is conservative in v1." };
}
