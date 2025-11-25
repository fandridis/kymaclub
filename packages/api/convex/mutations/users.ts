import { internalMutation, mutation } from "../_generated/server";
import { getAuthenticatedUserOrThrow } from "../utils";
import { v } from "convex/values";
import { internalMutationWithTriggers } from "../triggers";

export const updateUserForModerationArgs = v.object({
    userId: v.id("users"),
    updateData: v.any(), // Partial<Doc<"users">>
});

export const updateUserForModeration = internalMutationWithTriggers({
    args: updateUserForModerationArgs,
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, args.updateData);
    }
});

/***************************************************************
 * Delete User (Soft Delete)
 ***************************************************************/
export const deleteUser = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        // 1. Soft delete the user
        await ctx.db.patch(user._id, {
            deleted: true,
            deletedAt: Date.now(),
            deletedBy: user._id,
        });

        // 2. Remove all auth sessions for this user
        const sessions = await ctx.db
            .query("authSessions")
            .withIndex("userId", (q) => q.eq("userId", user._id))
            .collect();

        for (const session of sessions) {
            await ctx.db.delete(session._id);
        }

        return { success: true };
    },
});
