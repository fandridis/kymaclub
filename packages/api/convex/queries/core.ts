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
        // --- STEP 1: Check for Explicit Authorization (Override Check) ---
        // An entry in the authorized list grants access, regardless of their existing user status.
        const authorized = await ctx.db
            .query("authorizedBusinessEmails")
            .withIndex("by_email", (q) => q.eq("email", email))
            .filter((q) => q.neq(q.field("deleted"), true))
            .first();

        if (authorized) {
            // Check if authorization has expired
            if (authorized.expiresAt && authorized.expiresAt < Date.now()) {
                // The authorization exists but has expired. Proceed to check existing user status.
            } else {
                // Explicit, non-expired authorization found -> GRANT ACCESS
                return true;
            }
        }

        // --- STEP 2: Check Existing User Status (Fallback Check) ---
        const existingUser = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", email))
            .filter((q) => q.neq(q.field("deleted"), true))
            .first();

        if (existingUser) {
            // If the user is a blocked mobile consumer, deny access (unless they passed the explicit check above)
            if (existingUser.signupSource === "mobile-consumer") {
                // Existing mobile consumer who was not explicitly authorized -> DENY ACCESS
                return false;
            }

            // For all other existing users (web-consumer, web-business, or undefined) -> GRANT ACCESS
            return true;
        }

        // --- STEP 3: Default Deny ---
        // If the email was neither explicitly authorized nor belonged to an existing, non-mobile-consumer user.
        return false;
    }
});

/**
 * Get pending auth language for OTP email localization (internal use only)
 * Called by ResendOTP providers to get user's language preference before sending OTP
 */
export const getPendingAuthLanguage = internalQuery({
    args: { email: v.string() },
    returns: v.union(
        v.object({
            language: v.string(),
            expiresAt: v.number(),
        }),
        v.null()
    ),
    handler: async (ctx, { email }) => {
        const pending = await ctx.db
            .query("pendingAuthLanguages")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        if (!pending) {
            return null;
        }

        // Check if expired
        if (pending.expiresAt < Date.now()) {
            return null;
        }

        return {
            language: pending.language,
            expiresAt: pending.expiresAt,
        };
    },
});