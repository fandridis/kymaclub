import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { reviewsService } from "../../services/reviewsService";

/***************************************************************
 * Get Venue Reviews
 ***************************************************************/
export const getVenueReviews = query({
  args: {
    venueId: v.id("venues"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return reviewsService.getVenueReviews({ ctx, args });
  }
});

/***************************************************************
 * Check if current user can review venue
 ***************************************************************/
export const canUserReviewVenue = query({
  args: {
    venueId: v.id("venues")
  },
  returns: v.object({
    canReview: v.boolean(),
    reason: v.optional(v.union(v.literal("no_attendance"), v.literal("recent_review"))),
    nextReviewDate: v.optional(v.number()),
    lastReviewDate: v.optional(v.number())
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);
    return reviewsService.canUserReviewVenue({
      ctx,
      venueId: args.venueId,
      userId: user._id
    });
  }
});

/***************************************************************
 * Get user's review for a venue (if exists)
 ***************************************************************/
export const getUserReviewForVenue = query({
  args: {
    venueId: v.id("venues")
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrThrow(ctx);

    return reviewsService.getUserMostRecentReviewForVenue({
      ctx,
      venueId: args.venueId,
      userId: user._id
    });
  }
});

/***************************************************************
 * Get venue rating summary
 ***************************************************************/
export const getVenueRatingSummary = query({
  args: {
    venueId: v.id("venues")
  },
  handler: async (ctx, args) => {
    // Get all visible reviews for this venue
    const reviews = await ctx.db
      .query("venueReviews")
      .withIndex("by_venue_visible", (q) =>
        q.eq("venueId", args.venueId).eq("isVisible", true)
      )
      .filter((q) => q.eq(q.field("deleted"), false))
      .collect();

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0
        }
      };
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Calculate rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    return {
      averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
      totalReviews: reviews.length,
      ratingDistribution
    };
  }
});

/***************************************************************
 * Get Reviews for All Venues of a Business
 ***************************************************************/
export const getBusinessReviews = query({
  args: {
    businessId: v.id("businesses"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 10, 50); // Max 50 reviews per request

    const reviews = await ctx.db
      .query("venueReviews")
      .withIndex("by_business_created", (q) =>
        q.eq("businessId", args.businessId)
      )
      .filter((q) => q.and(
        q.eq(q.field("deleted"), false),
        q.eq(q.field("isVisible"), true)
      ))
      .order("desc") // Most recent first
      .take(limit);

    return reviews;
  }
});

/***************************************************************
 * Get Review by ID (Internal)
 ***************************************************************/
export const getReviewById = internalQuery({
  args: {
    reviewId: v.id("venueReviews")
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.reviewId);
  }
});