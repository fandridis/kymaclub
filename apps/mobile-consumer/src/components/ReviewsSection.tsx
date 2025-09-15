import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { PenIcon, MessageCircleIcon, CheckIcon } from 'lucide-react-native';
import { StarRating } from './StarRating';
import { ReviewsCarousel } from './ReviewsCarousel';
import { WriteReviewModal } from './WriteReviewModal';
import { useBusinessReviews } from '../hooks/useBusinessReviews';
import { useReviewEligibility } from '../hooks/useReviewEligibility';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import { theme } from '../theme';

interface ReviewsSectionProps {
  venueId: Id<"venues">;
  venueName: string;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  venueId,
  venueName
}) => {
  const [isWriteReviewModalVisible, setIsWriteReviewModalVisible] = useState(false);
  const { reviews, ratingsSummary, userReview, isLoading } = useBusinessReviews(venueId);
  const { isEligible, reason } = useReviewEligibility(venueId);

  const handleWriteReviewPress = () => {
    if (!isEligible) {
      Alert.alert('Cannot Review', reason || 'You are not eligible to review this venue.');
      return;
    }

    setIsWriteReviewModalVisible(true);
  };

  const handleReviewSubmitted = () => {
    // Reviews will be automatically refetched due to Convex reactivity
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  console.log('isEligible', isEligible);

  return (
    <View>
      {/* Section Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.sectionTitle}>Rating & Reviews</Text>
      </View>

      {/* Rating Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.ratingRow}>
          <View style={styles.ratingInfo}>
            <Text style={styles.averageRating}>
              {ratingsSummary.averageRating.toFixed(1)}
            </Text>
            <StarRating rating={Math.floor(ratingsSummary.averageRating)} size={20} />
            <Text style={styles.reviewCount}>
              {ratingsSummary.totalReviews} {ratingsSummary.totalReviews === 1 ? 'review' : 'reviews'}
            </Text>
          </View>

          {/* Write Review Button */}
          <TouchableOpacity
            style={[styles.writeReviewButton, !isEligible && styles.writeReviewButtonDisabled]}
            onPress={handleWriteReviewPress}
            activeOpacity={0.7}
          >
            {!isEligible ? (
              <CheckIcon size={16} color={theme.colors.zinc[700]} />
            ) : (
              <PenIcon size={16} color={theme.colors.zinc[700]} />
            )}
            <Text style={[styles.writeReviewText, !isEligible && styles.writeReviewTextDisabled]}>
              {!isEligible && userReview ? 'Reviewed Recently' : 'Write Review'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reviews Carousel */}
      {reviews.length > 0 ? (
        <ReviewsCarousel reviews={reviews} showTitle={false} />
      ) : (
        <View style={styles.noReviewsContainer}>
          <MessageCircleIcon size={40} color={theme.colors.zinc[300]} />
          <Text style={styles.noReviewsTitle}>No reviews yet</Text>
          <Text style={styles.noReviewsSubtitle}>
            Be the first to share your experience!
          </Text>
        </View>
      )}

      {/* Write Review Modal */}
      <WriteReviewModal
        isVisible={isWriteReviewModalVisible}
        onClose={() => setIsWriteReviewModalVisible(false)}
        venueId={venueId}
        venueName={venueName}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.zinc[500],
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.zinc[900],
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  averageRating: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.zinc[900],
  },
  reviewCount: {
    fontSize: 14,
    color: theme.colors.zinc[600],
    fontWeight: '500',
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.zinc[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.zinc[200],
  },
  writeReviewButtonDisabled: {
    backgroundColor: theme.colors.zinc[50],
    borderColor: theme.colors.zinc[100],
  },
  writeReviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.zinc[700],
  },
  writeReviewTextDisabled: {
    color: theme.colors.zinc[400],
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noReviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.zinc[900],
    marginTop: 12,
    marginBottom: 4,
  },
  noReviewsSubtitle: {
    fontSize: 14,
    color: theme.colors.zinc[500],
    textAlign: 'center',
  },
});