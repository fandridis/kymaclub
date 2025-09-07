import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { api } from '@repo/api/convex/_generated/api';
import type { Id } from '@repo/api/convex/_generated/dataModel';

export const useReviewEligibility = (venueId: Id<"venues"> | null) => {
  // Check if user can review (6-month cooldown period)
  const reviewEligibility = useQuery(
    api.queries.reviews.canUserReviewVenue,
    venueId ? { venueId } : "skip"
  );

  const isEligible = reviewEligibility?.canReview ?? false;

  let reason: string | null = null;
  if (reviewEligibility && !reviewEligibility.canReview && reviewEligibility.nextReviewDate) {
    const nextDate = format(new Date(reviewEligibility.nextReviewDate), 'MMM d, yyyy');
    reason = `You can review this venue again after ${nextDate}`;
  }

  return {
    isEligible,
    isLoading: reviewEligibility === undefined,
    reason,
    nextReviewDate: reviewEligibility?.nextReviewDate ? new Date(reviewEligibility.nextReviewDate) : undefined,
    lastReviewDate: reviewEligibility?.lastReviewDate ? new Date(reviewEligibility.lastReviewDate) : undefined
  };
};