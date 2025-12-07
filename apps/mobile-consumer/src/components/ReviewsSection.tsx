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
import { useTypedTranslation } from '../i18n/typed';

interface ReviewsSectionProps {
  venueId: Id<"venues">;
  venueName: string;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  venueId,
  venueName
}) => {
  const { t } = useTypedTranslation();
  const [isWriteReviewModalVisible, setIsWriteReviewModalVisible] = useState(false);
  const { reviews, ratingsSummary, isLoading } = useBusinessReviews(venueId);
  const { isEligible, reason, ineligibilityReason } = useReviewEligibility(venueId);

  const handleWriteReviewPress = () => {
    if (!isEligible) {
      Alert.alert(t('reviews.cannotReview'), reason || t('reviews.notEligibleToReview'));
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
        <Text style={styles.loadingText}>{t('reviews.loadingReviews')}</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Section Title & Write Review Button */}
      <View style={styles.titleContainer}>
        <Text style={styles.sectionTitle}>{t('reviews.title')}</Text>

        {/* Write Review Button */}
        <TouchableOpacity
          style={[styles.writeReviewButton, !isEligible && styles.writeReviewButtonDisabled]}
          onPress={handleWriteReviewPress}
          activeOpacity={0.7}
        >
          {ineligibilityReason === 'recent_review' ? (
            <CheckIcon size={14} color={theme.colors.zinc[700]} />
          ) : (
            <PenIcon size={14} color={theme.colors.zinc[700]} />
          )}
          <Text style={[styles.writeReviewText, !isEligible && styles.writeReviewTextDisabled]}>
            {ineligibilityReason === 'recent_review' ? t('reviews.reviewedRecently') : t('reviews.writeReview')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rating Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.ratingRow}>
          <Text style={styles.averageRating}>
            {ratingsSummary.averageRating.toFixed(1)}
          </Text>
          <View style={styles.starsContainer}>
            <StarRating rating={Math.floor(ratingsSummary.averageRating)} size={20} />
            <Text style={styles.reviewCount}>
              {ratingsSummary.totalReviews} {ratingsSummary.totalReviews === 1 ? t('reviews.review') : t('reviews.reviews')}
            </Text>
          </View>
        </View>
      </View>

      {/* Reviews Carousel */}
      {reviews.length > 0 ? (
        <ReviewsCarousel reviews={reviews} showTitle={false} />
      ) : (
        <View style={styles.noReviewsContainer}>
          <MessageCircleIcon size={40} color={theme.colors.zinc[300]} />
          <Text style={styles.noReviewsTitle}>{t('reviews.noReviews')}</Text>
          <Text style={styles.noReviewsSubtitle}>
            {t('reviews.beTheFirstToShare')}
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
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    alignItems: 'center',
    gap: 12,
  },
  starsContainer: {
    gap: 2,
  },
  averageRating: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.zinc[900],
    lineHeight: 40,
  },
  reviewCount: {
    fontSize: 14,
    color: theme.colors.zinc[500],
    fontWeight: '500',
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.zinc[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.zinc[200],
  },
  writeReviewButtonDisabled: {
    backgroundColor: theme.colors.zinc[50],
    borderColor: theme.colors.zinc[100],
  },
  writeReviewText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.zinc[900],
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