export function compareTextRequirements(oldRequirement, newRequirement) {
    const oldWords = new Set((oldRequirement ?? "").toLowerCase().split(/\W+/).filter(Boolean));
    const newWords = new Set(newRequirement.toLowerCase().split(/\W+/).filter(Boolean));
    const added = [...newWords].filter((word) => !oldWords.has(word));
    const removed = [...oldWords].filter((word) => !newWords.has(word));
    return { added, removed, magnitude: added.length + removed.length };
}
