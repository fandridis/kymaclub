import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Id } from "../convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import { creditService } from "./creditService";

/**
 * Simple Credit Reconciliation Service
 * 
 * This service does ONE thing: keeps user.credits cache in sync with the ledger.
 * It's a lightweight utility that other services can call when they need
 * to ensure credit balances are accurate.
 * 
 * Usage:
 * - Call before displaying user credits to ensure accuracy
 * - Call after credit operations to verify cache is updated
 * - Call periodically for maintenance
 */
export const reconciliationService = {
  /**
   * Reconcile a single user's credit cache with their ledger balance
   * 
   * @param ctx - Convex context
   * @param userId - User to reconcile
   * @param updateCache - Whether to update the cache if it's wrong (default: true)
   * @returns Simple result showing if cache was updated
   */
  reconcileUser: async ({
    ctx,
    userId,
    updateCache = true
  }: {
    ctx: MutationCtx | QueryCtx;
    userId: Id<"users">;
    updateCache?: boolean;
  }): Promise<{
    userId: Id<"users">;
    cachedCredits: number;
    actualCredits: number;
    wasUpdated: boolean;
  }> => {
    try {
      // Get user
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new ConvexError({
          message: `User not found: ${userId}`,
          field: "userId",
          code: ERROR_CODES.USER_NOT_FOUND
        });
      }

      // Get actual balance from ledger (source of truth)
      const actualCredits = await creditService.getBalance(ctx, { userId });
      const cachedCredits = user.credits ?? 0;

      let wasUpdated = false;

      // Update cache if it's wrong and update is requested
      if (updateCache && cachedCredits !== actualCredits) {
        // Only update if this is a mutation context
        if ('db' in ctx && 'patch' in ctx.db) {
          await ctx.db.patch(userId, {
            credits: actualCredits
          });
          wasUpdated = true;
        }
      }

      return {
        userId,
        cachedCredits,
        actualCredits,
        wasUpdated
      };

    } catch (error) {
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
   * Reconcile multiple users (simple loop, no batching complexity)
   */
  reconcileUsers: async ({
    ctx,
    userIds,
    updateCache = true
  }: {
    ctx: MutationCtx;
    userIds: Id<"users">[];
    updateCache?: boolean;
  }): Promise<{
    processedCount: number;
    updatedCount: number;
    results: Array<{
      userId: Id<"users">;
      cachedCredits: number;
      actualCredits: number;
      wasUpdated: boolean;
    }>;
  }> => {
    const results = [];
    let updatedCount = 0;

    // Simple loop - no batching, no delays, no complexity
    for (const userId of userIds) {
      try {
        const result = await reconciliationService.reconcileUser({
          ctx,
          userId,
          updateCache
        });

        results.push(result);
        if (result.wasUpdated) updatedCount++;

      } catch (error) {
        console.error(`Failed to reconcile user ${userId}:`, error);
        // Continue with other users - don't fail the whole operation
      }
    }

    return {
      processedCount: results.length,
      updatedCount,
      results
    };
  }
};
