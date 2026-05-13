export function stringifyJson(value) {
    return JSON.stringify(value ?? null);
}
export function parseJsonObject(value) {
    if (typeof value !== "string" || value.length === 0)
        return {};
    const parsed = JSON.parse(value);
    return isJsonObject(parsed) ? parsed : {};
}
export function parseJsonArray(value) {
    if (typeof value !== "string" || value.length === 0)
        return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
}
export function isJsonObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
