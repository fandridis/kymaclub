import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Id, Doc } from "../convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import type {
  ReconcileUserArgs,
  BulkReconciliationArgs,
  ReconciliationResult,
  BulkReconciliationResult,
  LedgerEntry
} from "../utils/reconciliation";
import { reconciliationRules } from "../rules/reconciliation";
import {
  calculateUserBalanceFromLedger,
  createReconciliationResult,
  prepareUserCacheUpdate,
  createUserBatches,
  calculateBulkProcessingStats,
  validateLedgerEntries
} from "../operations/reconciliation";

/**
 * Reconciliation Service - Keeps user credit cache in sync with ledger
 * 
 * This service handles:
 * - Reconciling individual user credit balances
 * - Bulk reconciliation operations  
 * - Cache consistency validation
 * - Inconsistency detection and reporting
 */
export const reconciliationService = {
  /**
   * Reconcile a single user's credit cache with their ledger entries
   * 
   * @param ctx - Convex context (mutation or query)
   * @param args - User ID and reconciliation options
   * @param performedBy - User performing the reconciliation (for audit trail)
   * @returns Detailed reconciliation result
   */
  reconcileUser: async ({
    ctx,
    args,
    performedBy
  }: {
    ctx: MutationCtx;
    args: ReconcileUserArgs;
    performedBy: Id<"users">;
  }): Promise<ReconciliationResult> => {
    const { userId, options } = args;
    const currentTime = Date.now();

    // Validate inputs
    reconciliationRules.validateUserId(userId);
    reconciliationRules.validateReconciliationOptions(options);

    try {
      // Get user and validate existence
      const user = await ctx.db.get(userId);
      const validUser = reconciliationRules.validateUserExists(user, userId);

      // Rate limiting: prevent too frequent reconciliation
      if (!options?.forceUpdate) {
        reconciliationRules.validateReconciliationFrequency(
          validUser.creditsLastUpdated ?? 0,
          options?.dryRun ? 0 : 60000 // 1 minute for non-dry runs
        );
      }

      // Get all ledger entries for this user
      const ledgerEntries = await getLedgerEntriesForUser(ctx, userId);

      // Validate ledger data integrity
      const validationErrors = validateLedgerEntries(ledgerEntries);
      if (validationErrors.length > 0) {
        throw new ConvexError({
          message: `Ledger data validation failed: ${validationErrors.join(", ")}`,
          field: "ledgerEntries",
          code: ERROR_CODES.VALIDATION_ERROR
        });
      }

      // Calculate balance from ledger (pure function)
      const computedBalance = calculateUserBalanceFromLedger(ledgerEntries, currentTime);

      // Validate computed balance is reasonable
      reconciliationRules.validateCalculatedBalance(computedBalance, userId);

      // Get cached balance from user record
      const cachedBalance = {
        credits: validUser.credits ?? 0,
        heldCredits: validUser.heldCredits ?? 0,
        lifetimeCredits: validUser.lifetimeCredits ?? 0,
        creditsLastUpdated: validUser.creditsLastUpdated ?? null
      };

      // Detect inconsistencies
      const inconsistencies = options?.includeAnalysis
        ? reconciliationRules.detectInconsistencies(computedBalance, cachedBalance)
        : [];

      // Determine if cache needs updating
      const shouldUpdate = reconciliationRules.shouldUpdateCache(
        computedBalance,
        cachedBalance,
        options
      );

      let wasUpdated = false;

      // Update cache if needed and not in dry-run mode
      if (shouldUpdate && !options?.dryRun) {
        const updateData = prepareUserCacheUpdate(computedBalance, performedBy, currentTime);

        await ctx.db.patch(userId, updateData);
        wasUpdated = true;

        // Log reconciliation for audit trail
        await logReconciliationEvent(ctx, {
          userId,
          computedBalance,
          cachedBalance,
          performedBy,
          wasUpdated,
          inconsistencies: inconsistencies.length,
          timestamp: currentTime
        });
      }

      // Create and return reconciliation result
      return createReconciliationResult(
        userId,
        computedBalance,
        cachedBalance,
        inconsistencies,
        wasUpdated,
        currentTime
      );

    } catch (error) {
      // Log reconciliation failure for debugging
      console.error(`Reconciliation failed for user ${userId}:`, error);

      if (error instanceof ConvexError) {
        throw error;
      }

      throw new ConvexError({
        message: `Reconciliation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        field: "reconciliation",
        code: ERROR_CODES.RECONCILIATION_FAILED
      });
    }
  },

  /**
   * Reconcile multiple users in batches
   * 
   * @param ctx - Convex mutation context
   * @param args - Bulk reconciliation arguments
   * @param performedBy - User performing the reconciliation
   * @returns Bulk reconciliation results and statistics
   */
  reconcileUsers: async ({
    ctx,
    args,
    performedBy
  }: {
    ctx: MutationCtx;
    args: BulkReconciliationArgs;
    performedBy: Id<"users">;
  }): Promise<BulkReconciliationResult> => {
    const startTime = Date.now();

    // Validate bulk operation arguments
    reconciliationRules.validateBulkReconciliationArgs(args);

    // Get user IDs to process
    let userIds = args.userIds;
    if (!userIds || userIds.length === 0) {
      // If no specific users provided, get all users (with reasonable limit)
      const allUsers = await ctx.db
        .query("users")
        .filter(q => q.eq(q.field("deleted"), false))
        .take(10000); // Reasonable limit for bulk operations

      userIds = allUsers.map(user => user._id);
    }

    const batchSize = args.batchSize ?? 100;
    const batches = createUserBatches(userIds, batchSize);

    const results: ReconciliationResult[] = [];
    const errors: Array<{ userId: Id<"users">; error: string }> = [];

    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} users)`);

      // Process users in current batch
      for (const userId of batch) {
        try {
          const result = await reconciliationService.reconcileUser({
            ctx,
            args: { userId, options: args.options },
            performedBy
          });

          results.push(result);

        } catch (error) {
          console.error(`Failed to reconcile user ${userId}:`, error);
          errors.push({
            userId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Add small delay between batches to prevent overwhelming the system
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const endTime = Date.now();

    // Calculate processing statistics
    const stats = calculateBulkProcessingStats(results, errors, startTime, endTime);

    console.log(`Bulk reconciliation completed: ${stats.processedCount} processed, ${stats.updatedCount} updated, ${stats.inconsistencyCount} inconsistencies, ${stats.errorCount} errors`);

    return {
      processedCount: stats.processedCount,
      updatedCount: stats.updatedCount,
      inconsistencyCount: stats.inconsistencyCount,
      results,
      processingTimeMs: stats.processingTimeMs,
      errors
    };
  },

  /**
   * Get current balance for a user (from cache, with optional reconciliation)
   * 
   * @param ctx - Query context
   * @param userId - User to get balance for
   * @param reconcile - Whether to reconcile before returning balance
   * @returns Current user credit balance
   */
  getUserBalance: async ({
    ctx,
    userId,
    reconcile = false
  }: {
    ctx: QueryCtx | MutationCtx;
    userId: Id<"users">;
    reconcile?: boolean;
  }): Promise<{
    availableCredits: number;
    heldCredits: number;
    lifetimeCredits: number;
    lastUpdated: number | null;
  }> => {
    reconciliationRules.validateUserId(userId);

    const user = await ctx.db.get(userId);
    const validUser = reconciliationRules.validateUserExists(user, userId);

    // If reconciliation requested and we have mutation context
    if (reconcile && 'db' in ctx && 'patch' in ctx.db) {
      try {
        // This is a bit of a hack - we need a performedBy user
        // In a real implementation, this should be passed in
        await reconciliationService.reconcileUser({
          ctx: ctx as MutationCtx,
          args: { userId },
          performedBy: userId // User reconciling themselves
        });

        // Refresh user data after reconciliation
        const updatedUser = await ctx.db.get(userId);
        if (updatedUser) {
          return {
            availableCredits: updatedUser.credits ?? 0,
            heldCredits: updatedUser.heldCredits ?? 0,
            lifetimeCredits: updatedUser.lifetimeCredits ?? 0,
            lastUpdated: updatedUser.creditsLastUpdated ?? null
          };
        }
      } catch (error) {
        console.warn(`Failed to reconcile user ${userId} before balance check:`, error);
        // Fall back to cached values
      }
    }

    return {
      availableCredits: validUser.credits ?? 0,
      heldCredits: validUser.heldCredits ?? 0,
      lifetimeCredits: validUser.lifetimeCredits ?? 0,
      lastUpdated: validUser.creditsLastUpdated ?? null
    };
  }
};

/**
 * Get all ledger entries for a user
 * Helper function to fetch ledger data
 */
async function getLedgerEntriesForUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<LedgerEntry[]> {
  const entries = await ctx.db
    .query("creditLedger")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  return entries.map(entry => ({
    userId: entry.userId!,
    amount: entry.amount,
    type: entry.type,
    effectiveAt: entry.effectiveAt,
    expiresAt: entry.expiresAt,
    deleted: entry.deleted ?? false
  }));
}

/**
 * Log reconciliation event for audit trail
 * Helper function to maintain reconciliation history
 */
async function logReconciliationEvent(
  ctx: MutationCtx,
  event: {
    userId: Id<"users">;
    computedBalance: any;
    cachedBalance: any;
    performedBy: Id<"users">;
    wasUpdated: boolean;
    inconsistencies: number;
    timestamp: number;
  }
): Promise<void> {
  // In a production system, you might want to store reconciliation events
  // for audit trails and debugging. For now, we just log to console.

  console.log(`[RECONCILIATION] User: ${event.userId}, Updated: ${event.wasUpdated}, Inconsistencies: ${event.inconsistencies}, By: ${event.performedBy}`);

  // Uncomment if you want to store reconciliation events in the database:
  /*
  await ctx.db.insert("reconciliationEvents", {
    userId: event.userId,
    computedBalance: event.computedBalance,
    cachedBalance: event.cachedBalance,
    performedBy: event.performedBy,
    wasUpdated: event.wasUpdated,
    inconsistencyCount: event.inconsistencies,
    createdAt: event.timestamp
  });
  */
}