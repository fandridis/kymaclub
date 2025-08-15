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