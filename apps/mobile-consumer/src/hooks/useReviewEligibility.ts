import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { api } from '@repo/api/convex/_generated/api';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import { useTypedTranslation } from '../i18n/typed';

export type ReviewIneligibilityReason = "no_attendance" | "recent_review";

export const useReviewEligibility = (venueId: Id<"venues"> | null) => {
  const { t } = useTypedTranslation();

  // Check if user can review (attendance requirement + 6-month cooldown period)
  const reviewEligibility = useQuery(
    api.queries.reviews.canUserReviewVenue,
    venueId ? { venueId } : "skip"
  );

  const isEligible = reviewEligibility?.canReview ?? false;
  const ineligibilityReason = reviewEligibility?.reason as ReviewIneligibilityReason | undefined;

  let reason: string | null = null;
  if (reviewEligibility && !reviewEligibility.canReview) {
    if (reviewEligibility.reason === "no_attendance") {
      reason = t('reviews.mustAttendFirst');
    } else if (reviewEligibility.reason === "recent_review" && reviewEligibility.nextReviewDate) {
      const nextDate = format(new Date(reviewEligibility.nextReviewDate), 'MMM d, yyyy');
      reason = t('reviews.canReviewAfter', { date: nextDate });
    }
  }

  return {
    isEligible,
    isLoading: reviewEligibility === undefined,
    reason,
    ineligibilityReason,
    nextReviewDate: reviewEligibility?.nextReviewDate ? new Date(reviewEligibility.nextReviewDate) : undefined,
    lastReviewDate: reviewEligibility?.lastReviewDate ? new Date(reviewEligibility.lastReviewDate) : undefined
  };
};