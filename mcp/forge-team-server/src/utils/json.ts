export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject { [key: string]: JsonValue | undefined }

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export function parseJsonObject(value: unknown): JsonObject {
  if (typeof value !== "string" || value.length === 0) return {};
  const parsed = JSON.parse(value) as unknown;
  return isJsonObject(parsed) ? parsed : {};
}

export function parseJsonArray(value: unknown): JsonValue[] {
  if (typeof value !== "string" || value.length === 0) return [];
  const parsed = JSON.parse(value) as unknown;
  return Array.isArray(parsed) ? parsed as JsonValue[] : [];
}

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
