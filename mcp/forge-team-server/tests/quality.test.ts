import { describe, expect, it } from "vitest";
import { secretScanText } from "../src/engine/qualityMatrix.js";

describe("quality matrix", () => {
  it("detects hardcoded secret patterns", () => {
    expect(secretScanText("api_key='1234567890abcdef'").length).toBeGreaterThan(0);
  });
});
