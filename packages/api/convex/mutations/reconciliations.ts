import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { reconciliationService } from "../../services/reconciliationService";

/**
 * Simple reconciliation mutation for admin use
 * 
 * This mutation ensures the user's cached credit balance matches their actual ledger balance.
 * It's a simple utility for admins to fix any cache inconsistencies.
 */
export const reconcileUser = mutation({
    args: {
        userId: v.id("users"),
        updateCache: v.optional(v.boolean())
    },
    returns: v.object({
        userId: v.id("users"),
        cachedCredits: v.number(),
        actualCredits: v.number(),
        wasUpdated: v.boolean()
    }),
    handler: async (ctx, args) => {
        const { userId, updateCache = true } = args;

        return await reconciliationService.reconcileUser({
            ctx,
            userId,
            updateCache
        });
    }
});

/**
 * Bulk reconciliation for multiple users
 * 
 * Simple utility for admins to reconcile multiple users at once.
 */
export const reconcileUsers = mutation({
    args: {
        userIds: v.array(v.id("users")),
        updateCache: v.optional(v.boolean())
    },
    returns: v.object({
        processedCount: v.number(),
        updatedCount: v.number(),
        results: v.array(v.object({
            userId: v.id("users"),
            cachedCredits: v.number(),
            actualCredits: v.number(),
            wasUpdated: v.boolean()
        }))
    }),
    handler: async (ctx, args) => {
        const { userIds, updateCache = true } = args;

        return await reconciliationService.reconcileUsers({
            ctx,
            userIds,
            updateCache
        });
    }
}); 