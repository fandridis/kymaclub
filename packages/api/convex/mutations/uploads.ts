import { mutation } from "../_generated/server";
import { getAuthenticatedUserOrThrow } from "../utils";
import { v } from "convex/values";
import { mutationWithTriggers } from "../triggers";
import { uploadService } from "../../services/uploadService";

export const generateUploadUrl = mutation({
    args: {},
    returns: v.object({ url: v.string() }),
    handler: async (ctx, _args) => {
        await getAuthenticatedUserOrThrow(ctx);
        return uploadService.generateUploadUrl({ ctx });
    }
});

export const addVenueImage = mutationWithTriggers({
    args: { venueId: v.id("venues"), storageId: v.id("_storage") },
    returns: v.object({ storageId: v.id("_storage"), updatedVenueId: v.id("venues") }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return uploadService.addVenueImage({ ctx, args, user });
    }
});

export const removeVenueImage = mutationWithTriggers({
    args: { venueId: v.id("venues"), storageId: v.id("_storage") },
    returns: v.object({ storageId: v.id("_storage"), updatedVenueId: v.id("venues") }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return uploadService.removeVenueImage({ ctx, args, user });
    }
});

export const addTemplateImage = mutationWithTriggers({
    args: { templateId: v.id("classTemplates"), storageId: v.id("_storage") },
    returns: v.object({ storageId: v.id("_storage"), updatedTemplateId: v.id("classTemplates") }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return uploadService.addTemplateImage({ ctx, args, user });
    }
});

export const removeTemplateImage = mutationWithTriggers({
    args: { templateId: v.id("classTemplates"), storageId: v.id("_storage") },
    returns: v.object({ storageId: v.id("_storage"), updatedTemplateId: v.id("classTemplates") }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return uploadService.removeTemplateImage({ ctx, args, user });
    }
});

export const updateUserProfileImage = mutationWithTriggers({
    args: { storageId: v.id("_storage") },
    returns: v.object({ storageId: v.id("_storage"), updatedUserId: v.id("users") }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return uploadService.updateUserProfileImage({ ctx, args, user });
    }
});

export const removeUserProfileImage = mutationWithTriggers({
    args: {},
    returns: v.object({ removedStorageId: v.union(v.id("_storage"), v.null()), updatedUserId: v.id("users") }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return uploadService.removeUserProfileImage({ ctx, args, user });
    }
});

