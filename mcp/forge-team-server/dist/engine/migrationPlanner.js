export function migrationStepsForChange(changeType) {
    if (changeType === "contract")
        return ["Freeze current contract", "Add versioned replacement", "Update callers", "Run contract tests", "Keep rollback path"];
    if (changeType === "architecture")
        return ["Reopen architecture pass", "Map affected modules", "Create migration tasks", "Verify build after each module"];
    return ["Update Project Brain", "Update task graph", "Patch affected files", "Run targeted gates"];
}
