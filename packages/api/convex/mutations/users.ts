import { internalMutation } from "../_generated/server";
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
