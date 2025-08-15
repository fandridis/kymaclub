import type { Id } from "../convex/_generated/dataModel";

/**
 * Simple reconciliation result
 * Just shows if the cache was updated
 */
export type SimpleReconciliationResult = {
  userId: Id<"users">;
  cachedCredits: number;
  actualCredits: number;
  wasUpdated: boolean;
};

/**
 * Bulk reconciliation result
 * Simple summary of multiple reconciliations
 */
export type BulkReconciliationResult = {
  processedCount: number;
  updatedCount: number;
  results: SimpleReconciliationResult[];
};