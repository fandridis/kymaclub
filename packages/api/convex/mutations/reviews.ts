import { mutation, internalMutation } from "../_generated/server";
import { Infer, v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { reviewsService } from "../../services/reviewsService";
import { mutationWithTriggers, internalMutationWithTriggers } from "../triggers";

/***************************************************************
 * Create Venue Review
 ***************************************************************/
export const createVenueReviewArgs = v.object({
  venueId: v.id("venues"),
  rating: v.number(), // 1-5 star rating
  comment: v.optional(v.string()) // Optional text review
});
export type CreateVenueReviewArgs = Infer<typeof createVenueReviewArgs>;

export const createVenueReview = mutationWithTriggers({
  args: createVenueReviewArgs,
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return reviewsService.createVenueReview({ ctx, args, user });
  }
});

/***************************************************************
 * Update Venue Review (for future use)
 ***************************************************************/
export const updateVenueReviewArgs = v.object({
  reviewId: v.id("venueReviews"),
  rating: v.optional(v.number()),
  comment: v.optional(v.string())
});
export type UpdateVenueReviewArgs = Infer<typeof updateVenueReviewArgs>;

export const updateVenueReview = mutationWithTriggers({
  args: updateVenueReviewArgs,
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);

    // Get existing review to validate ownership
    const existingReview = await ctx.db.get(args.reviewId);
    if (!existingReview || existingReview.deleted) {
      throw new Error("Review not found");
    }

    if (existingReview.userId !== user._id) {
      throw new Error("You can only update your own reviews");
    }

    // Update the review
    const updateData: any = {
      updatedAt: Date.now(),
      updatedBy: user._id,
    };

    if (args.rating !== undefined) {
      updateData.rating = args.rating;
    }

    if (args.comment !== undefined) {
      updateData.comment = args.comment;
    }

    await ctx.db.patch(args.reviewId, updateData);

    // Update venue rating stats if rating changed
    if (args.rating !== undefined) {
      await reviewsService._updateVenueRatingStats(ctx, existingReview.venueId);
    }

    return { updatedReviewId: args.reviewId };
  }
});

/***************************************************************
 * Delete Venue Review (soft delete)
 ***************************************************************/
export const deleteVenueReviewArgs = v.object({
  reviewId: v.id("venueReviews")
});
export type DeleteVenueReviewArgs = Infer<typeof deleteVenueReviewArgs>;

export const deleteVenueReview = mutationWithTriggers({
  args: deleteVenueReviewArgs,
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);

    // Get existing review to validate ownership
    const existingReview = await ctx.db.get(args.reviewId);
    if (!existingReview || existingReview.deleted) {
      throw new Error("Review not found");
    }

    if (existingReview.userId !== user._id) {
      throw new Error("You can only delete your own reviews");
    }

    // Soft delete the review
    await ctx.db.patch(args.reviewId, {
      deleted: true,
      deletedAt: Date.now(),
      deletedBy: user._id,
    });

    // Update venue rating stats
    await reviewsService._updateVenueRatingStats(ctx, existingReview.venueId);

    return { deletedReviewId: args.reviewId };
  }
});


/***************************************************************
 * Helper mutations for action-compatible service methods
 ***************************************************************/
export const updateReviewForModerationArgs = v.object({
  reviewId: v.id("venueReviews"),
  updateData: v.any(), // Partial<Doc<"venueReviews">>
});
export type UpdateReviewForModerationArgs = Infer<typeof updateReviewForModerationArgs>;

export const updateReviewForModeration = internalMutationWithTriggers({
  args: updateReviewForModerationArgs,
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reviewId, args.updateData);
  }
});

export const updateVenueRatingStatsArgs = v.object({
  venueId: v.id("venues")
});
export type UpdateVenueRatingStatsArgs = Infer<typeof updateVenueRatingStatsArgs>;

export const updateVenueRatingStats = internalMutation({
  args: updateVenueRatingStatsArgs,
  handler: async (ctx, args) => {
    await reviewsService._updateVenueRatingStats(ctx, args.venueId);
  }
});
