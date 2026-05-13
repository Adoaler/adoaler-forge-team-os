import { describe, expect, it } from "vitest";
import { extractSymbols } from "../src/engine/repoWorldModel.js";

describe("repo world model", () => {
  it("extracts TypeScript symbols", () => {
    const symbols = extractSymbols("x.ts", "export function hello() { return 1; } class Local {}");
    expect(symbols.map((s) => s.name)).toContain("hello");
    expect(symbols.map((s) => s.name)).toContain("Local");
  });
});
