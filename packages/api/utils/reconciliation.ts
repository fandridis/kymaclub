import type { Id } from "../convex/_generated/dataModel";

/**
 * User credit balance calculation result
 */
export type UserCreditBalance = {
  /** Currently available credits (not expired, not held) */
  availableCredits: number;
  /** Credits held for pending bookings */
  heldCredits: number;
  /** Total credits earned over lifetime */
  lifetimeCredits: number;
  /** Credits that have expired */
  expiredCredits: number;
  /** Total of all credits (including expired) */
  totalCredits: number;
  /** Timestamp of calculation */
  calculatedAt: number;
};

/**
 * Reconciliation result with before/after comparison
 */
export type ReconciliationResult = {
  /** User ID that was reconciled */
  userId: Id<"users">;
  /** Balance calculation from ledger */
  computedBalance: UserCreditBalance;
  /** Previous cached values */
  cachedBalance: {
    credits: number;
    heldCredits: number;
    lifetimeCredits: number;
    creditsLastUpdated: number | null;
  };
  /** Changes detected */
  deltas: {
    availableCredits: number;
    heldCredits: number;
    lifetimeCredits: number;
  };
  /** Whether the cache was updated */
  wasUpdated: boolean;
  /** Any inconsistencies detected */
  inconsistencies: string[];
  /** Reconciliation timestamp */
  reconciledAt: number;
};

/**
 * Options for reconciliation behavior
 */
export type ReconciliationOptions = {
  /** Force update cache even if values match */
  forceUpdate?: boolean;
  /** Include detailed inconsistency analysis */
  includeAnalysis?: boolean;
  /** Only calculate, don't update cache */
  dryRun?: boolean;
};

/**
 * Arguments for reconciling a single user
 */
export type ReconcileUserArgs = {
  userId: Id<"users">;
  options?: ReconciliationOptions;
};

/**
 * Arguments for bulk reconciliation
 */
export type BulkReconciliationArgs = {
  /** Specific user IDs to reconcile (if empty, reconciles all) */
  userIds?: Id<"users">[];
  /** Batch size for processing */
  batchSize?: number;
  /** Options applied to all reconciliations */
  options?: ReconciliationOptions;
};

/**
 * Result of bulk reconciliation
 */
export type BulkReconciliationResult = {
  /** Total users processed */
  processedCount: number;
  /** Users that were updated */
  updatedCount: number;
  /** Users with inconsistencies found */
  inconsistencyCount: number;
  /** Reconciliation results for each user */
  results: ReconciliationResult[];
  /** Total processing time in milliseconds */
  processingTimeMs: number;
  /** Any errors encountered */
  errors: Array<{
    userId: Id<"users">;
    error: string;
  }>;
};

/**
 * Credit ledger entry for balance calculations
 */
export type LedgerEntry = {
  userId: Id<"users">;
  amount: number;
  type: string;
  effectiveAt: number;
  expiresAt?: number;
  deleted: boolean;
};