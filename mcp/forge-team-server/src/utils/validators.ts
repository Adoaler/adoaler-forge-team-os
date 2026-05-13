import { z } from "zod";

export const taskStatusSchema = z.enum(["planned", "ready", "in_progress", "needs_review", "rejected", "repair_required", "complete", "blocked", "cancelled_by_change"]);
export const governorStateSchema = z.enum(["NORMAL", "PLAN_ONLY", "IMPLEMENTATION", "REVIEW_ONLY", "CHANGE_REQUEST", "IMPACT_ANALYSIS", "REPLAN", "MIGRATION", "REPAIR_ONLY", "RELEASE_READY", "BLOCKED"]);
export const riskSchema = z.enum(["low", "medium", "high", "critical"]);
export const criticVerdictSchema = z.enum(["approve", "approve_with_notes", "reject"]);

export function nowIso(): string {
  return new Date().toISOString();
}

export function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
