export const requiredProjectBrainFiles = [
  "PRODUCT.md",
  "NON_GOALS.md",
  "ARCHITECTURE.md",
  "MODULE_GRAPH.md",
  "API_CONTRACTS.md",
  "DATA_MODEL.md",
  "SECURITY_MODEL.md",
  "PERFORMANCE_BUDGET.md",
  "TEST_STRATEGY.md",
  "RELEASE_PLAN.md",
  "RISK_REGISTER.md",
  "TASK_GRAPH.json",
  "PROJECT_STATE.json"
];

export function missingProjectBrainFiles(existing: string[]) {
  const set = new Set(existing);
  return requiredProjectBrainFiles.filter((file) => !set.has(file));
}
