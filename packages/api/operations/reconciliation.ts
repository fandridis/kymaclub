import type { Id, Doc } from "../convex/_generated/dataModel";
import type {
  LedgerEntry,
  UserCreditBalance,
  ReconciliationResult,
  ReconciliationOptions
} from "../utils/reconciliation";

/**
 * Pure domain operations for credit reconciliation
 * These functions contain no side effects and are fully testable
 */

/**
 * Calculate user credit balance from ledger entries
 * Pure function - no database access, fully testable
 */
export function calculateUserBalanceFromLedger(
  ledgerEntries: LedgerEntry[],
  currentTime: number = Date.now()
): UserCreditBalance {
  let availableCredits = 0;
  let heldCredits = 0;
  let lifetimeCredits = 0;
  let expiredCredits = 0;

  for (const entry of ledgerEntries) {
    // Skip deleted entries
    if (entry.deleted) {
      continue;
    }

    // Skip future entries (not yet effective)
    if (entry.effectiveAt > currentTime) {
      continue;
    }

    // Calculate lifetime credits (all positive entries)
    if (entry.amount > 0) {
      lifetimeCredits += entry.amount;
    }

    // Check if credits have expired
    if (entry.expiresAt && entry.expiresAt <= currentTime && entry.amount > 0) {
      expiredCredits += entry.amount;
      continue; // Don't count expired credits as available
    }

    // Determine if credits are held or available
    if (isHeldCreditType(entry.type)) {
      heldCredits += Math.abs(entry.amount); // Held credits are stored as negative
    } else {
      availableCredits += entry.amount;
    }
  }

  const totalCredits = availableCredits + heldCredits + expiredCredits;

  return {
    availableCredits: Math.max(0, availableCredits), // Ensure no negative balances
    heldCredits: Math.max(0, heldCredits),
    lifetimeCredits: Math.max(0, lifetimeCredits),
    expiredCredits: Math.max(0, expiredCredits),
    totalCredits: Math.max(0, totalCredits),
    calculatedAt: currentTime
  };
}

/**
 * Create reconciliation result by comparing computed vs cached balances
 * Pure function - no side effects
 */
export function createReconciliationResult(
  userId: Id<"users">,
  computedBalance: UserCreditBalance,
  cachedBalance: {
    credits: number;
    heldCredits: number;
    lifetimeCredits: number;
    creditsLastUpdated: number | null;
  },
  inconsistencies: string[],
  wasUpdated: boolean,
  currentTime: number = Date.now()
): ReconciliationResult {
  return {
    userId,
    computedBalance,
    cachedBalance,
    deltas: {
      availableCredits: computedBalance.availableCredits - cachedBalance.credits,
      heldCredits: computedBalance.heldCredits - cachedBalance.heldCredits,
      lifetimeCredits: computedBalance.lifetimeCredits - cachedBalance.lifetimeCredits
    },
    wasUpdated,
    inconsistencies,
    reconciledAt: currentTime
  };
}

/**
 * Prepare user cache update data
 * Pure function - returns the update object
 */
export function prepareUserCacheUpdate(
  balance: UserCreditBalance,
  updatedBy: Id<"users">,
  currentTime: number = Date.now()
): {
  credits: number;
  heldCredits: number;
  lifetimeCredits: number;
  creditsLastUpdated: number;
} {
  return {
    credits: balance.availableCredits,
    heldCredits: balance.heldCredits,
    lifetimeCredits: balance.lifetimeCredits,
    creditsLastUpdated: currentTime,
  };
}

/**
 * Group users into batches for bulk processing
 * Pure function - no side effects
 */
export function createUserBatches(
  userIds: Id<"users">[],
  batchSize: number = 100
): Id<"users">[][] {
  if (batchSize <= 0) {
    throw new Error("Batch size must be positive");
  }

  const batches: Id<"users">[][] = [];
  
  for (let i = 0; i < userIds.length; i += batchSize) {
    batches.push(userIds.slice(i, i + batchSize));
  }

  return batches;
}

/**
 * Calculate processing statistics for bulk operations
 * Pure function - aggregates results
 */
export function calculateBulkProcessingStats(
  results: ReconciliationResult[],
  errors: Array<{ userId: Id<"users">; error: string }>,
  startTime: number,
  endTime: number
) {
  return {
    processedCount: results.length,
    updatedCount: results.filter(r => r.wasUpdated).length,
    inconsistencyCount: results.filter(r => r.inconsistencies.length > 0).length,
    processingTimeMs: endTime - startTime,
    errorCount: errors.length,
    averageProcessingTimeMs: results.length > 0 ? (endTime - startTime) / results.length : 0
  };
}

/**
 * Determine if a credit ledger type represents held credits
 * Pure function - business logic for credit types
 */
function isHeldCreditType(ledgerType: string): boolean {
  // Define which ledger entry types represent held credits
  const HELD_CREDIT_TYPES = [
    'BOOKING_HOLD',
    'PENDING_REFUND',
    'DISPUTED_CHARGE',
    'ADMIN_HOLD'
  ];
  
  return HELD_CREDIT_TYPES.includes(ledgerType);
}

/**
 * Validate ledger entries are properly formatted
 * Pure function - data validation
 */
export function validateLedgerEntries(entries: LedgerEntry[]): string[] {
  const errors: string[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    
    if (!Number.isFinite(entry.amount)) {
      errors.push(`Entry ${i}: amount must be a finite number`);
    }
    
    if (entry.effectiveAt <= 0) {
      errors.push(`Entry ${i}: effectiveAt must be positive`);
    }
    
    if (entry.expiresAt && entry.expiresAt <= entry.effectiveAt) {
      errors.push(`Entry ${i}: expiresAt must be after effectiveAt`);
    }
    
    if (!entry.userId) {
      errors.push(`Entry ${i}: userId is required`);
    }
    
    if (!entry.type || typeof entry.type !== 'string') {
      errors.push(`Entry ${i}: type must be a non-empty string`);
    }
  }

  return errors;
}

/**
 * Sort reconciliation results by inconsistency severity
 * Pure function - for reporting and analysis
 */
export function sortResultsByPriority(results: ReconciliationResult[]): ReconciliationResult[] {
  return [...results].sort((a, b) => {
    // First priority: users with inconsistencies
    if (a.inconsistencies.length > 0 && b.inconsistencies.length === 0) return -1;
    if (a.inconsistencies.length === 0 && b.inconsistencies.length > 0) return 1;
    
    // Second priority: magnitude of credit differences
    const aDelta = Math.abs(a.deltas.availableCredits) + Math.abs(a.deltas.lifetimeCredits);
    const bDelta = Math.abs(b.deltas.availableCredits) + Math.abs(b.deltas.lifetimeCredits);
    
    return bDelta - aDelta;
  });
}