import type { MutationCtx, QueryCtx, ActionCtx } from "../convex/_generated/server";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import { internal } from "../convex/_generated/api";

// Define args types for reviews
export type CreateVenueReviewArgs = {
  venueId: Id<"venues">;
  rating: number; // 1-5
  comment?: string;
};

export type GetVenueReviewsArgs = {
  venueId: Id<"venues">;
  limit?: number;
  offset?: number;
};

export type UpdateVenueReviewArgs = {
  reviewId: Id<"venueReviews">;
  rating?: number;
  comment?: string;
};

// Service object with all review operations
export const reviewsService = {
  /**
   * Create a new venue review
   */
  createVenueReview: async ({
    ctx,
    args,
    user
  }: {
    ctx: MutationCtx,
    args: CreateVenueReviewArgs,
    user: Doc<"users">
  }): Promise<{ createdReviewId: Id<"venueReviews"> }> => {
    const now = Date.now();

    // Validate rating
    if (args.rating < 1 || args.rating > 5) {
      throw new ConvexError({
        message: "Rating must be between 1 and 5",
        field: "rating",
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }

    // Get venue to validate it exists and get business info
    const venue = await ctx.db.get(args.venueId);
    if (!venue || venue.deleted) {
      throw new ConvexError({
        message: "Venue not found",
        field: "venueId",
        code: ERROR_CODES.RESOURCE_NOT_FOUND
      });
    }

    // Check if user has reviewed this venue within the last 6 months
    const sixMonthsAgo = now - (6 * 30 * 24 * 60 * 60 * 1000); // 6 months in milliseconds
    const recentReview = await ctx.db
      .query("venueReviews")
      .withIndex("by_user_venue", (q) =>
        q.eq("userId", user._id).eq("venueId", args.venueId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("deleted"), false),
          q.gt(q.field("createdAt"), sixMonthsAgo)
        )
      )
      .first();

    if (recentReview) {
      const nextReviewDate = new Date(recentReview.createdAt + (6 * 30 * 24 * 60 * 60 * 1000));
      throw new ConvexError({
        message: `You can review this venue again after ${nextReviewDate.toLocaleDateString()}`,
        field: "venueId",
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }

    // Create user snapshot
    const userSnapshot = {
      name: user.name || "Anonymous",
      email: user.email || "",
    };

    // Create venue snapshot
    const venueSnapshot = {
      name: venue.name,
    };

    // Create the review - initially not visible and pending AI moderation
    const reviewId = await ctx.db.insert("venueReviews", {
      businessId: venue.businessId,
      venueId: args.venueId,
      userId: user._id,
      rating: args.rating,
      comment: args.comment,
      userSnapshot,
      venueSnapshot,
      isVisible: false, // Not visible until AI moderation
      moderationStatus: "pending", // Awaiting AI check
      createdAt: now,
      createdBy: user._id,
      updatedAt: now,
      updatedBy: user._id,
      deleted: false,
    });

    // Note: Venue rating stats will be updated after AI moderation
    // The trigger will handle this when the review becomes visible

    return { createdReviewId: reviewId };
  },

  /**
   * Get reviews for a venue
   */
  getVenueReviews: async ({
    ctx,
    args
  }: {
    ctx: QueryCtx,
    args: GetVenueReviewsArgs
  }): Promise<Doc<"venueReviews">[]> => {

    const limit = Math.min(args.limit || 20, 100); // Max 100 reviews per request
    const offset = args.offset || 0;

    const reviews = await ctx.db
      .query("venueReviews")
      .withIndex("by_venue_visible_created", (q) =>
        q.eq("venueId", args.venueId).eq("isVisible", true)
      )
      .filter((q) => q.eq(q.field("deleted"), false))
      .order("desc") // Most recent first
      .collect();

    return reviews.slice(offset, offset + limit);
  },

  /**
   * Update venue rating and review count (internal helper)
   * Only considers visible reviews that have been approved
   */
  _updateVenueRatingStats: async (ctx: MutationCtx, venueId: Id<"venues">) => {
    // Get all visible reviews for this venue
    const reviews = await ctx.db
      .query("venueReviews")
      .withIndex("by_venue_visible", (q) =>
        q.eq("venueId", venueId).eq("isVisible", true)
      )
      .filter((q) => q.eq(q.field("deleted"), false))
      .collect();

    if (reviews.length === 0) {
      // No visible reviews - reset to undefined/0
      await ctx.db.patch(venueId, {
        rating: undefined,
        reviewCount: 0,
      });
      return;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await ctx.db.patch(venueId, {
      rating: averageRating,
      reviewCount: reviews.length,
    });
  },

  /**
   * Check if user can review a venue (helper for UI)
   */
  canUserReviewVenue: async ({
    ctx,
    venueId,
    userId
  }: {
    ctx: QueryCtx,
    venueId: Id<"venues">,
    userId: Id<"users">
  }): Promise<{ canReview: boolean; nextReviewDate?: number; lastReviewDate?: number }> => {

    // Check if user has reviewed this venue within the last 6 months
    const now = Date.now();
    const sixMonthsAgo = now - (6 * 30 * 24 * 60 * 60 * 1000); // 6 months in milliseconds

    const recentReview = await ctx.db
      .query("venueReviews")
      .withIndex("by_user_venue", (q) =>
        q.eq("userId", userId).eq("venueId", venueId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("deleted"), false),
          q.gt(q.field("createdAt"), sixMonthsAgo)
        )
      )
      .first();

    if (recentReview) {
      const nextReviewTimestamp = recentReview.createdAt + (6 * 30 * 24 * 60 * 60 * 1000);
      return {
        canReview: false,
        nextReviewDate: nextReviewTimestamp,
        lastReviewDate: recentReview.createdAt
      };
    }

    return { canReview: true };
  },

  /**
   * Get user's most recent review for a venue (if exists)
   */
  getUserMostRecentReviewForVenue: async ({
    ctx,
    venueId,
    userId
  }: {
    ctx: QueryCtx,
    venueId: Id<"venues">,
    userId: Id<"users">
  }): Promise<Doc<"venueReviews"> | null> => {
    return ctx.db
      .query("venueReviews")
      .withIndex("by_user_venue", (q) =>
        q.eq("userId", userId).eq("venueId", venueId)
      )
      .filter((q) => q.eq(q.field("deleted"), false))
      .order("desc") // Most recent first
      .first();
  },

  /**
   * Process AI moderation result for a review
   */
  processAIModeration: async ({
    ctx,
    reviewId,
    moderationResult
  }: {
    ctx: MutationCtx,
    reviewId: Id<"venueReviews">,
    moderationResult: {
      score: number; // 0-100 confidence score
      reason?: string;
      status: "auto_approved" | "flagged" | "auto_rejected";
    }
  }): Promise<void> => {
    const now = Date.now();

    const updateData: Partial<Doc<"venueReviews">> = {
      moderationStatus: moderationResult.status,
      aiModerationScore: moderationResult.score,
      aiModerationReason: moderationResult.reason,
      aiModeratedAt: now,
      updatedAt: now,
    };

    // Determine visibility based on moderation status
    if (moderationResult.status === "auto_approved") {
      updateData.isVisible = true;
    } else if (moderationResult.status === "flagged") {
      updateData.isVisible = false;
      updateData.flaggedAt = now;
      updateData.flaggedReason = moderationResult.reason;
    } else if (moderationResult.status === "auto_rejected") {
      updateData.isVisible = false;
    }

    await ctx.db.patch(reviewId, updateData);

    // If review is now visible, update venue stats
    if (updateData.isVisible) {
      const review = await ctx.db.get(reviewId);
      if (review) {
        await reviewsService._updateVenueRatingStats(ctx, review.venueId);
      }
    }
  },

  /**
   * Manually moderate a review (admin function)
   */
  manualModerateReview: async ({
    ctx,
    reviewId,
    moderatorId,
    decision,
    note
  }: {
    ctx: MutationCtx,
    reviewId: Id<"venueReviews">,
    moderatorId: Id<"users">,
    decision: "manual_approved" | "manual_rejected",
    note?: string;
  }): Promise<void> => {
    const now = Date.now();

    const updateData: Partial<Doc<"venueReviews">> = {
      moderationStatus: decision,
      moderatedBy: moderatorId,
      moderatedAt: now,
      moderationNote: note,
      updatedAt: now,
      updatedBy: moderatorId,
    };

    // Set visibility based on decision
    updateData.isVisible = decision === "manual_approved";

    await ctx.db.patch(reviewId, updateData);

    // If review is now visible, update venue stats
    if (updateData.isVisible) {
      const review = await ctx.db.get(reviewId);
      if (review) {
        await reviewsService._updateVenueRatingStats(ctx, review.venueId);
      }
    }
  },

  /**
   * Get reviews pending manual moderation
   */
  getReviewsPendingModeration: async ({
    ctx,
    limit = 20,
    offset = 0
  }: {
    ctx: QueryCtx,
    limit?: number,
    offset?: number;
  }): Promise<Doc<"venueReviews">[]> => {
    const reviews = await ctx.db
      .query("venueReviews")
      .withIndex("by_deleted", (q) => q.eq("deleted", false))
      .filter((q) => q.eq(q.field("moderationStatus"), "flagged"))
      .order("desc") // Most recent first
      .collect();

    return reviews.slice(offset, offset + limit);
  },

  /**
   * Get review moderation statistics
   */
  getModerationStats: async ({
    ctx
  }: {
    ctx: QueryCtx;
  }): Promise<{
    pending: number;
    autoApproved: number;
    flagged: number;
    autoRejected: number;
    manualApproved: number;
    manualRejected: number;
  }> => {
    const allReviews = await ctx.db
      .query("venueReviews")
      .filter((q) => q.eq(q.field("deleted"), false))
      .collect();

    const stats = {
      pending: 0,
      autoApproved: 0,
      flagged: 0,
      autoRejected: 0,
      manualApproved: 0,
      manualRejected: 0,
    };

    for (const review of allReviews) {
      switch (review.moderationStatus) {
        case "pending":
          stats.pending++;
          break;
        case "auto_approved":
          stats.autoApproved++;
          break;
        case "flagged":
          stats.flagged++;
          break;
        case "auto_rejected":
          stats.autoRejected++;
          break;
        case "manual_approved":
          stats.manualApproved++;
          break;
        case "manual_rejected":
          stats.manualRejected++;
          break;
      }
    }

    return stats;
  },

  /**
   * Process AI moderation result for a review (action-compatible version)
   */
  processAIModerationFromAction: async ({
    ctx,
    reviewId,
    moderationResult
  }: {
    ctx: ActionCtx,
    reviewId: Id<"venueReviews">,
    moderationResult: {
      score: number; // 0-100 confidence score
      reason?: string;
      status: "auto_approved" | "flagged" | "auto_rejected";
    }
  }): Promise<void> => {
    const now = Date.now();

    const updateData: Partial<Doc<"venueReviews">> = {
      moderationStatus: moderationResult.status,
      aiModerationScore: moderationResult.score,
      aiModerationReason: moderationResult.reason,
      aiModeratedAt: now,
      updatedAt: now,
    };

    // Determine visibility based on moderation status
    if (moderationResult.status === "auto_approved") {
      updateData.isVisible = true;
    } else if (moderationResult.status === "flagged") {
      updateData.isVisible = false;
      updateData.flaggedAt = now;
      updateData.flaggedReason = moderationResult.reason;
    } else if (moderationResult.status === "auto_rejected") {
      updateData.isVisible = false;
    }

    // Use runMutation to update the review
    await ctx.runMutation(internal.mutations.reviews.updateReviewForModeration, {
      reviewId,
      updateData
    });

    // If review is now visible, update venue stats
    if (updateData.isVisible) {
      const review = await ctx.runQuery(internal.queries.reviews.getReviewById, { reviewId });
      if (review) {
        await ctx.runMutation(internal.mutations.reviews.updateVenueRatingStats, {
          venueId: review.venueId
        });
      }
    }
  },
};