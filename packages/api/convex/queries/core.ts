import { query, internalQuery } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { coreService } from "../../services/coreService";

/***************************************************************
 * Queries - Thin wrappers around handlers
 ***************************************************************/

/**
 * Get the current user and business for the authenticated user
 */
export const getCurrentUserQuery = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        return coreService.getCurrentUserWithBusiness({ ctx, userId });
    },
});

/**
 * Get user by ID (internal use only)
 */
export const getUserById = internalQuery({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        return await ctx.db.get(userId);
    },
}); 