import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import type { Id } from '@repo/api/convex/_generated/dataModel';

export const useBusinessReviews = (venueId: Id<"venues"> | null) => {
  const reviews = useQuery(
    api.queries.reviews.getVenueReviews,
    venueId ? { venueId, limit: 20 } : "skip"
  );

  const canUserReview = useQuery(
    api.queries.reviews.canUserReviewVenue,
    venueId ? { venueId } : "skip"
  );

  const userReview = useQuery(
    api.queries.reviews.getUserReviewForVenue,
    venueId ? { venueId } : "skip"
  );

  const ratingsSummary = useQuery(
    api.queries.reviews.getVenueRatingSummary,
    venueId ? { venueId } : "skip"
  );

  return {
    reviews: reviews || [],
    canUserReview: canUserReview ?? true,
    userReview: userReview || null,
    ratingsSummary: ratingsSummary || {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    },
    isLoading: reviews === undefined || canUserReview === undefined
  };
};