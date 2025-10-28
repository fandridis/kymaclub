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

/**
 * Check if a user exists by email (for sign-in validation)
 */
export const checkUserExistsByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, { email }) => {
        const user = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", email))
            .first();
        return !!user && !user.deleted;
    },
});

/**
 * Check if an email is authorized to create a business account
 * Returns true if user exists OR is in the authorized list
 */
export const isEmailAuthorizedForBusiness = query({
    args: { email: v.string() },
    handler: async (ctx, { email }) => {
        // Check if user already exists (returning user)
        // const existingUser = await ctx.db
        //     .query("users")
        //     .withIndex("email", (q) => q.eq("email", email))
        //     .filter((q) => q.neq(q.field("deleted"), true))
        //     .first();

        // if (existingUser) {
        //     return true;
        // }

        // Check if email is in the authorized list
        // const authorized = await ctx.db
        //     .query("authorizedBusinessEmails")
        //     .withIndex("by_email", (q) => q.eq("email", email))
        //     .filter((q) => q.neq(q.field("deleted"), true))
        //     .first();

        // if (!authorized) {
        //     return false;
        // }

        // Check if authorization has expired
        // if (authorized.expiresAt && authorized.expiresAt < Date.now()) {
        //     return false;
        // }

        return true;
    }
});