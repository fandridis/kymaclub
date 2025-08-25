import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Id, Doc } from "../convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import { classTemplateRules } from "../rules/classTemplate";

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

    // TODO: Add venue rules validation
    // venueRules.ensureCanUpdateVenue(venue, user);

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

    // TODO: Add venue rules validation
    // venueRules.ensureCanUpdateVenue(venue, user);

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
    // Remove old profile image if it exists
    if (user.consumerProfileImageStorageId) {
      await ctx.storage.delete(user.consumerProfileImageStorageId);
    }

    // Update user with new profile image
    await ctx.db.patch(user._id, {
      consumerProfileImageStorageId: args.storageId,
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
};