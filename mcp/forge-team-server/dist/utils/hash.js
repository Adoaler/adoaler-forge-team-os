import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
export function sha256Text(text) {
    return createHash("sha256").update(text, "utf8").digest("hex");
}
export function sha256File(path) {
    return sha256Text(readFileSync(path, "utf8"));
}
