import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { uploadService } from "../../services/uploadService";

export const getUrls = query({
    args: { storageIds: v.array(v.id("_storage")) },
    returns: v.array(
        v.object({
            storageId: v.id("_storage"),
            url: v.union(v.string(), v.null()),
        })
    ),
    handler: async (ctx, args) => {
        return uploadService.getUploadUrls({ ctx, storageIds: args.storageIds });
    },
});

export const getUserProfileImageUrl = query({
    args: { userId: v.id("users") },
    returns: v.union(v.string(), v.null()),
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.consumerProfileImageStorageId) {
            return null;
        }

        // Only return image URL if it's approved
        const isApproved =
            user.profileImageModerationStatus === "auto_approved" ||
            user.profileImageModerationStatus === "manual_approved";

        if (!isApproved) {
            return null; // Don't show unapproved/flagged/rejected images
        }

        return await ctx.storage.getUrl(user.consumerProfileImageStorageId);
    },
});

export const getUserProfileImageModerationStatus = query({
    args: {},
    returns: v.union(
        v.object({
            status: v.union(
                v.literal("pending"),
                v.literal("auto_approved"),
                v.literal("flagged"),
                v.literal("auto_rejected"),
                v.literal("manual_approved"),
                v.literal("manual_rejected")
            ),
            reason: v.optional(v.string()),
            moderatedAt: v.optional(v.number()),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const user = await ctx.db.get(userId);
        if (!user || !user.profileImageModerationStatus) {
            return null;
        }

        return {
            status: user.profileImageModerationStatus,
            reason: user.profileImageModerationReason,
            moderatedAt: user.profileImageModeratedAt,
        };
    },
});