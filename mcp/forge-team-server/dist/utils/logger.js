export function log(message, meta) {
    const suffix = meta === undefined ? "" : " " + JSON.stringify(redact(meta));
    console.error("[forge-team] " + message + suffix);
}
export function redact(value) {
    if (typeof value === "string") {
        return value.replace(/(sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_]{8,}|[A-Za-z0-9_]*TOKEN[A-Za-z0-9_]*=)[^\s]+/g, "[REDACTED]");
    }
    if (Array.isArray(value))
        return value.map(redact);
    if (value && typeof value === "object") {
        const out = {};
        for (const [key, item] of Object.entries(value)) {
            out[key] = /secret|token|key|password/i.test(key) ? "[REDACTED]" : redact(item);
        }
        return out;
    }
    return value;
}
