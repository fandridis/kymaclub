import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Id } from "../convex/_generated/dataModel";
import { creditService } from "./creditService";

/**
 * Simple User Service
 * 
 * Demonstrates how to use the simplified credit service.
 * This service shows the pattern other services should follow.
 */
export const userService = {
    /**
     * Get user's current credit balance
     */
    getUserCredits: async (
        ctx: QueryCtx | MutationCtx,
        userId: Id<"users">
    ): Promise<number> => {
        return await creditService.getBalance(ctx, userId);
    },

    /**
     * Check if user can afford a class
     */
    canAffordClass: async (
        ctx: QueryCtx | MutationCtx,
        userId: Id<"users">,
        requiredCredits: number
    ): Promise<boolean> => {
        const currentCredits = await creditService.getBalance(ctx, userId);
        return currentCredits >= requiredCredits;
    }
}; 