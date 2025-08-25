import { query } from "../_generated/server";
import { v } from "convex/values";
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
        return await ctx.storage.getUrl(user.consumerProfileImageStorageId);
    },
});