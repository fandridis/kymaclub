import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import { useState } from 'react';

export const useSubmitReview = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createReviewMutation = useMutation(api.mutations.reviews.createVenueReview);

  const submitReview = async ({
    venueId,
    rating,
    comment
  }: {
    venueId: Id<"venues">;
    rating: number;
    comment?: string;
  }) => {
    try {
      setIsSubmitting(true);
      const result = await createReviewMutation({
        venueId,
        rating,
        comment
      });
      return { success: true, reviewId: result.createdReviewId };
    } catch (error) {
      console.error('Failed to submit review:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit review' 
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitReview,
    isSubmitting
  };
};