import { internalMutation, mutation } from "../_generated/server";
import { getAuthenticatedUserOrThrow } from "../utils";
import { ConvexError, v } from "convex/values";
import { internalMutationWithTriggers } from "../triggers";
import { ERROR_CODES } from "../../utils/errorCodes";
import { hasRenewingSubscription } from "./payments";

export const updateUserForModerationArgs = v.object({
    userId: v.id("users"),
    updateData: v.any(), // Partial<Doc<"users">>
});

export const updateUserForModeration = internalMutationWithTriggers({
    args: updateUserForModerationArgs,
    returns: v.null(),
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, args.updateData);
    }
});

/***************************************************************
 * Delete User (Soft Delete)
 * 
 * Marks the user for deletion. After 7 days, the permanentlyDeleteUsers
 * cron job will permanently remove all user data.
 * 
 * Prerequisites:
 * - User must not have an active subscription that will renew
 * - Users who have already cancelled (cancelAtPeriodEnd: true) CAN delete
 * 
 * IMPORTANT: This mutation does NOT delete auth sessions.
 * The client should call logout() after this mutation succeeds.
 * This ensures proper cleanup of both server and client auth state.
 * Any orphaned sessions will be cleaned up by the permanent deletion cron.
 ***************************************************************/
export const deleteUser = mutation({
    args: {},
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        // 1. Check for renewing subscriptions before allowing deletion
        // Users with active subscriptions must cancel first to prevent billing issues
        // Note: Users who already cancelled (cancelAtPeriodEnd: true) can delete
        const hasRenewing = await hasRenewingSubscription(ctx, user._id);

        if (hasRenewing) {
            throw new ConvexError({
                message: "Please cancel your subscription before deleting your account. You can manage your subscription in your profile settings.",
                code: ERROR_CODES.ACTIVE_SUBSCRIPTION_EXISTS,
            });
        }

        // 2. Soft delete the user
        await ctx.db.patch(user._id, {
            deleted: true,
            deletedAt: Date.now(),
            deletedBy: user._id,
        });

        // Note: We intentionally do NOT delete auth sessions here.
        // The client will call logout() after this mutation, which properly
        // handles both server-side session cleanup and client-side state clearing.
        // Any orphaned sessions will be cleaned up by the permanent deletion cron.

        return { success: true };
    },
});
