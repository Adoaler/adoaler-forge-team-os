import ts from "typescript";
import { sha256Text } from "../utils/hash.js";
export function validateChunk(input) {
    const diagnostics = [];
    const duplicates = [];
    const source = ts.createSourceFile(input.file_path, input.content, ts.ScriptTarget.Latest, true);
    const parseDiagnostics = source.parseDiagnostics ?? [];
    for (const diag of parseDiagnostics) {
        const msg = ts.flattenDiagnosticMessageText(diag.messageText, "\n");
        diagnostics.push(msg);
    }
    const seen = new Set();
    for (const stmt of source.statements) {
        let key;
        if ((ts.isFunctionDeclaration(stmt) || ts.isClassDeclaration(stmt) || ts.isInterfaceDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt)) && stmt.name)
            key = ts.SyntaxKind[stmt.kind] + ":" + stmt.name.text;
        if (key && seen.has(key))
            duplicates.push(key);
        if (key)
            seen.add(key);
    }
    const importTexts = source.statements.filter(ts.isImportDeclaration).map((stmt) => stmt.getText(source));
    const duplicateImports = importTexts.filter((item, index) => importTexts.indexOf(item) !== index);
    return {
        valid: diagnostics.length === 0 && duplicates.length === 0 && duplicateImports.length === 0,
        syntax_errors: diagnostics,
        duplicate_symbols: duplicates,
        duplicate_imports: duplicateImports,
        hash: sha256Text(input.content),
        safe_boundary: findSafeBoundary(input.content)
    };
}
export function findSafeBoundary(content) {
    const trimmed = content.trimEnd();
    if (trimmed.length === 0)
        return { offset: 0, kind: "empty" };
    const lastNewline = trimmed.lastIndexOf("\n");
    const lastLine = trimmed.slice(lastNewline + 1);
    const openBraces = (trimmed.match(/\{/g) ?? []).length - (trimmed.match(/\}/g) ?? []).length;
    if (openBraces === 0 && /[;}\]]$/.test(trimmed))
        return { offset: trimmed.length, kind: "syntax_valid_boundary" };
    if (/^(export\s+)?(async\s+)?function\s+|^(export\s+)?class\s+|^describe\(/.test(lastLine))
        return { offset: lastNewline, kind: "before_incomplete_symbol" };
    return { offset: lastNewline > 0 ? lastNewline : trimmed.length, kind: "line_boundary" };
}
