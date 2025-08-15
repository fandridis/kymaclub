import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { reconciliationService } from "../../services/reconciliationService";
import type { ReconcileUserArgs } from "../../utils/reconciliation";

/**
 * Reconcile a single user's credit cache with their ledger entries
 * 
 * This mutation ensures the user's cached credit balance matches their actual ledger balance.
 * It can be used for:
 * - Manual reconciliation by admins
 * - Fixing inconsistencies
 * - Pre-balance-check reconciliation
 * 
 * @param userId - ID of the user to reconcile
 * @param options - Reconciliation options (dry run, force update, include analysis)
 * @param performedBy - ID of the user performing the reconciliation
 * @returns Detailed reconciliation result
 */
export const reconcileUser = mutation({
    args: {
        userId: v.id("users"),
        options: v.optional(v.object({
            dryRun: v.optional(v.boolean()),
            forceUpdate: v.optional(v.boolean()),
            includeAnalysis: v.optional(v.boolean())
        })),
        performedBy: v.id("users")
    },
    returns: v.object({
        userId: v.id("users"),
        computedBalance: v.object({
            availableCredits: v.number(),
            heldCredits: v.number(),
            lifetimeCredits: v.number(),
            expiredCredits: v.number(),
            totalCredits: v.number(),
            calculatedAt: v.number()
        }),
        cachedBalance: v.object({
            credits: v.number(),
            heldCredits: v.number(),
            lifetimeCredits: v.number(),
            creditsLastUpdated: v.union(v.number(), v.null())
        }),
        deltas: v.object({
            availableCredits: v.number(),
            heldCredits: v.number(),
            lifetimeCredits: v.number()
        }),
        wasUpdated: v.boolean(),
        inconsistencies: v.array(v.string()),
        reconciledAt: v.number()
    }),
    handler: async (ctx, args) => {
        const { userId, options, performedBy } = args;

        // Use the reconciliation service to perform the reconciliation
        const result = await reconciliationService.reconcileUser({
            ctx,
            args: { userId, options },
            performedBy
        });

        return result;
    }
});

/**
 * Reconcile multiple users in bulk
 * 
 * This mutation processes multiple users for reconciliation, useful for:
 * - System-wide reconciliation jobs
 * - Batch fixing of inconsistencies
 * - Scheduled maintenance operations
 * 
 * @param userIds - Array of user IDs to reconcile (empty for all users)
 * @param batchSize - Number of users to process per batch
 * @param options - Reconciliation options applied to all users
 * @param performedBy - ID of the user performing the bulk reconciliation
 * @returns Bulk reconciliation results and statistics
 */
export const reconcileUsers = mutation({
    args: {
        userIds: v.optional(v.array(v.id("users"))),
        batchSize: v.optional(v.number()),
        options: v.optional(v.object({
            dryRun: v.optional(v.boolean()),
            forceUpdate: v.optional(v.boolean()),
            includeAnalysis: v.optional(v.boolean())
        })),
        performedBy: v.id("users")
    },
    returns: v.object({
        processedCount: v.number(),
        updatedCount: v.number(),
        inconsistencyCount: v.number(),
        results: v.array(v.object({
            userId: v.id("users"),
            computedBalance: v.object({
                availableCredits: v.number(),
                heldCredits: v.number(),
                lifetimeCredits: v.number(),
                expiredCredits: v.number(),
                totalCredits: v.number(),
                calculatedAt: v.number()
            }),
            cachedBalance: v.object({
                credits: v.number(),
                heldCredits: v.number(),
                lifetimeCredits: v.number(),
                creditsLastUpdated: v.union(v.number(), v.null())
            }),
            deltas: v.object({
                availableCredits: v.number(),
                heldCredits: v.number(),
                lifetimeCredits: v.number()
            }),
            wasUpdated: v.boolean(),
            inconsistencies: v.array(v.string()),
            reconciledAt: v.number()
        })),
        processingTimeMs: v.number(),
        errors: v.array(v.object({
            userId: v.id("users"),
            error: v.string()
        }))
    }),
    handler: async (ctx, args) => {
        const { userIds, batchSize, options, performedBy } = args;

        // Use the reconciliation service to perform bulk reconciliation
        const result = await reconciliationService.reconcileUsers({
            ctx,
            args: { userIds, batchSize, options },
            performedBy
        });

        return result;
    }
}); 