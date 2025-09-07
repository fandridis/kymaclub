import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StarRating } from './StarRating';
import { ReviewDetailModal } from './ReviewDetailModal';
import { formatDistanceToNow } from 'date-fns';
import type { Doc } from '@repo/api/convex/_generated/dataModel';
import { theme } from '../theme';

interface ReviewCardProps {
  review: Doc<"venueReviews">;
}

// Character limit for truncation
const CHAR_LIMIT = 300;

// Helper function to truncate text at word boundary
const truncateText = (text: string, limit: number): string => {
  if (text.length <= limit) return text;

  // Find the last space before the limit
  const truncated = text.substring(0, limit);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  // If we found a space, truncate there; otherwise use the limit
  const cutoff = lastSpaceIndex > 0 ? lastSpaceIndex : limit;

  return text.substring(0, cutoff) + '...';
};

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const reviewDate = new Date(review.createdAt);
  const timeAgo = formatDistanceToNow(reviewDate, { addSuffix: true });

  // Determine if we should show "Read more" and get display text
  const { displayText, shouldShowReadMore } = useMemo(() => {
    if (!review.comment) {
      return { displayText: '', shouldShowReadMore: false };
    }

    const shouldTruncate = review.comment.length > CHAR_LIMIT;

    return {
      displayText: shouldTruncate
        ? truncateText(review.comment, CHAR_LIMIT)
        : review.comment,
      shouldShowReadMore: shouldTruncate
    };
  }, [review.comment]);

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {review.userSnapshot.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {review.userSnapshot.name || 'Anonymous User'}
              </Text>
              <Text style={styles.reviewDate}>{timeAgo}</Text>
            </View>
          </View>
          <StarRating rating={review.rating} size={16} />
        </View>

        {/* Comment */}
        {review.comment && (
          <View style={styles.commentContainer}>
            <Text style={styles.comment}>
              {displayText}
              {shouldShowReadMore && (
                <Text
                  style={styles.readMoreInline}
                  onPress={() => setIsDetailModalVisible(true)}
                >
                  {' '}Read more
                </Text>
              )}
            </Text>
          </View>
        )}
      </View>

      {/* Detail Modal */}
      <ReviewDetailModal
        isVisible={isDetailModalVisible}
        onClose={() => setIsDetailModalVisible(false)}
        review={review}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.zinc[100],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.zinc[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.zinc[700],
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.zinc[900],
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: theme.colors.zinc[500],
  },
  commentContainer: {
    marginTop: 8,
  },
  comment: {
    fontSize: 14,
    color: theme.colors.zinc[700],
    lineHeight: 20,
  },
  readMoreInline: {
    fontSize: 14,
    color: theme.colors.sky[600],
    fontWeight: '600',
  },
});