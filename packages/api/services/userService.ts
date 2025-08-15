import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Id } from "../convex/_generated/dataModel";
import { creditService } from "./creditService";

/**
 * Simple User Service
 * 
 * Demonstrates how to use the simplified reconciliation service.
 * This service shows the pattern other services should follow.
 */
export const userService = {
    /**
     * Get user's current credit balance
     * Automatically reconciles cache if needed
     */
    getUserCredits: async (
        ctx: QueryCtx | MutationCtx,
        userId: Id<"users">
    ): Promise<number> => {
        // This automatically reconciles the cache if needed
        return await creditService.getUserCredits(ctx, userId, true);
    },

    /**
     * Display user credits (read-only, no reconciliation)
     */
    displayUserCredits: async (
        ctx: QueryCtx,
        userId: Id<"users">
    ): Promise<number> => {
        // For display purposes, we don't need to reconcile
        return await creditService.getBalance(ctx, { userId });
    },

    /**
     * Check if user can afford a class
     * Automatically reconciles before checking
     */
    canAffordClass: async (
        ctx: QueryCtx | MutationCtx,
        userId: Id<"users">,
        requiredCredits: number
    ): Promise<boolean> => {
        const currentCredits = await creditService.getUserCredits(ctx, userId, true);
        return currentCredits >= requiredCredits;
    }
}; 