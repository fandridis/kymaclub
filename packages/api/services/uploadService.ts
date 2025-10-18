import type { MutationCtx, QueryCtx, ActionCtx } from "../convex/_generated/server";
import type { Id, Doc } from "../convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import { classTemplateRules } from "../rules/classTemplate";
import { venueRules } from "../rules/venue";
import { internal } from "../convex/_generated/api";

/**
 * Upload service for managing file uploads and associations with entities.
 */
export const uploadService = {
  /**
   * Generate a secure upload URL
   */
  generateUploadUrl: async ({ ctx }: { ctx: MutationCtx }): Promise<{ url: string }> => {
    const url = await ctx.storage.generateUploadUrl();
    return { url };
  },

  /**
   * Get URLs for multiple storage IDs
   */
  getUploadUrls: async ({
    ctx,
    storageIds
  }: {
    ctx: QueryCtx;
    storageIds: Id<"_storage">[]
  }): Promise<Array<{ storageId: Id<"_storage">; url: string | null }>> => {
    const results = await Promise.all(
      storageIds.map(async (storageId) => ({
        storageId,
        url: await ctx.storage.getUrl(storageId),
      }))
    );
    return results;
  },

  /**
   * Add an image to a venue
   */
  addVenueImage: async ({
    ctx,
    args,
    user,
  }: {
    ctx: MutationCtx;
    args: { venueId: Id<"venues">; storageId: Id<"_storage"> };
    user: Doc<"users">;
  }): Promise<{ storageId: Id<"_storage">; updatedVenueId: Id<"venues"> }> => {
    const venue = await ctx.db.get(args.venueId);
    if (!venue) {
      throw new ConvexError({ message: "Venue not found", code: ERROR_CODES.RESOURCE_NOT_FOUND });
    }

    // Ensure user has permission to update this venue
    venueRules.userMustBeVenueOwner(venue, user);

    const next = [...(venue.imageStorageIds ?? []), args.storageId];
    await ctx.db.patch(args.venueId, {
      imageStorageIds: next,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });

    return { storageId: args.storageId, updatedVenueId: args.venueId };
  },

  /**
   * Remove an image from a venue
   */
  removeVenueImage: async ({
    ctx,
    args,
    user,
  }: {
    ctx: MutationCtx;
    args: { venueId: Id<"venues">; storageId: Id<"_storage"> };
    user: Doc<"users">;
  }): Promise<{ storageId: Id<"_storage">; updatedVenueId: Id<"venues"> }> => {
    const venue = await ctx.db.get(args.venueId);
    if (!venue) {
      throw new ConvexError({ message: "Venue not found", code: ERROR_CODES.RESOURCE_NOT_FOUND });
    }

    // Ensure user has permission to update this venue
    venueRules.userMustBeVenueOwner(venue, user);

    const current = venue.imageStorageIds ?? [];
    const next = current.filter((id) => id !== args.storageId);

    await ctx.db.patch(args.venueId, {
      imageStorageIds: next,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });

    return { storageId: args.storageId, updatedVenueId: args.venueId };
  },

  /**
   * Add an image to a class template
   */
  addTemplateImage: async ({
    ctx,
    args,
    user,
  }: {
    ctx: MutationCtx;
    args: { templateId: Id<"classTemplates">; storageId: Id<"_storage"> };
    user: Doc<"users">;
  }): Promise<{ storageId: Id<"_storage">; updatedTemplateId: Id<"classTemplates"> }> => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new ConvexError({ message: "Class template not found", code: ERROR_CODES.RESOURCE_NOT_FOUND });
    }

    classTemplateRules.userMustBeTemplateOwner(template, user);

    const next = [...(template.imageStorageIds ?? []), args.storageId];
    await ctx.db.patch(args.templateId, {
      imageStorageIds: next,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });

    return { storageId: args.storageId, updatedTemplateId: args.templateId };
  },

  /**
   * Remove an image from a class template (also deletes from storage)
   */
  removeTemplateImage: async ({
    ctx,
    args,
    user,
  }: {
    ctx: MutationCtx;
    args: { templateId: Id<"classTemplates">; storageId: Id<"_storage"> };
    user: Doc<"users">;
  }): Promise<{ storageId: Id<"_storage">; updatedTemplateId: Id<"classTemplates"> }> => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new ConvexError({ message: "Class template not found", code: ERROR_CODES.RESOURCE_NOT_FOUND });
    }

    classTemplateRules.userMustBeTemplateOwner(template, user);

    const current = template.imageStorageIds ?? [];
    const next = current.filter((id) => id !== args.storageId);

    await ctx.db.patch(args.templateId, {
      imageStorageIds: next,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });

    // Delete the image from storage
    await ctx.storage.delete(args.storageId);

    return { storageId: args.storageId, updatedTemplateId: args.templateId };
  },

  /**
   * Update user profile image
   */
  updateUserProfileImage: async ({
    ctx,
    args,
    user,
  }: {
    ctx: MutationCtx;
    args: { storageId: Id<"_storage"> };
    user: Doc<"users">;
  }): Promise<{ storageId: Id<"_storage">; updatedUserId: Id<"users"> }> => {
    const oldStorageId = user.consumerProfileImageStorageId;

    // Delete old profile image if it exists
    if (oldStorageId) {
      await ctx.storage.delete(oldStorageId);
    }

    // Set new image with pending moderation status
    await ctx.db.patch(user._id, {
      consumerProfileImageStorageId: args.storageId,
      profileImageModerationStatus: "pending",
      profileImageModerationScore: undefined,
      profileImageModerationReason: undefined,
      profileImageModeratedAt: undefined,
      profileImageFlaggedAt: undefined,
      profileImageFlaggedReason: undefined,
    });

    return { storageId: args.storageId, updatedUserId: user._id };
  },

  /**
   * Remove user profile image (also deletes from storage)
   */
  removeUserProfileImage: async ({
    ctx,
    args,
    user,
  }: {
    ctx: MutationCtx;
    args: {};
    user: Doc<"users">;
  }): Promise<{ removedStorageId: Id<"_storage"> | null; updatedUserId: Id<"users"> }> => {
    const oldStorageId = user.consumerProfileImageStorageId || null;

    // Remove profile image reference from user
    await ctx.db.patch(user._id, {
      consumerProfileImageStorageId: undefined,
    });

    // Delete the image from storage if it exists
    if (oldStorageId) {
      await ctx.storage.delete(oldStorageId);
    }

    return { removedStorageId: oldStorageId, updatedUserId: user._id };
  },

  /**
   * Process AI moderation result for profile image (action-compatible)
   */
  processProfileImageModerationFromAction: async ({
    ctx,
    userId,
    imageStorageId,
    moderationResult
  }: {
    ctx: ActionCtx,
    userId: Id<"users">,
    imageStorageId: Id<"_storage">,
    moderationResult: {
      score: number; // 0-100 confidence score
      reason?: string;
      status: "auto_approved" | "flagged" | "auto_rejected";
    }
  }): Promise<void> => {
    console.log('💾 processProfileImageModerationFromAction: Starting for user:', userId, 'status:', moderationResult.status);

    const now = Date.now();

    const updateData: Partial<Doc<"users">> = {
      profileImageModerationStatus: moderationResult.status,
      profileImageModerationScore: moderationResult.score,
      profileImageModerationReason: moderationResult.reason,
      profileImageModeratedAt: now,
    };

    console.log('💾 processProfileImageModerationFromAction: Base update data:', updateData);

    // Handle different moderation statuses
    if (moderationResult.status === "auto_approved") {
      // Image approved - keep it visible
      console.log('💾 processProfileImageModerationFromAction: Auto-approved - keeping image visible');
      updateData.consumerProfileImageStorageId = imageStorageId;
    } else if (moderationResult.status === "flagged") {
      // Flagged for review - hide but keep for admin review
      console.log('💾 processProfileImageModerationFromAction: Flagged - hiding image from user');
      updateData.consumerProfileImageStorageId = undefined;
      updateData.profileImageFlaggedAt = now;
      updateData.profileImageFlaggedReason = moderationResult.reason;
    } else if (moderationResult.status === "auto_rejected") {
      // Auto-rejected - remove and delete from storage
      console.log('💾 processProfileImageModerationFromAction: Auto-rejected - deleting image');
      updateData.consumerProfileImageStorageId = undefined;

      // Delete the inappropriate image
      await ctx.storage.delete(imageStorageId);
    }

    console.log('💾 processProfileImageModerationFromAction: Final update data:', updateData);

    // Update user via internal mutation
    console.log('💾 processProfileImageModerationFromAction: Calling internal mutation...');
    await ctx.runMutation(internal.mutations.users.updateUserForModeration, {
      userId,
      updateData
    });
    console.log('💾 processProfileImageModerationFromAction: Internal mutation completed successfully');
  },
};