import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { XIcon } from 'lucide-react-native';
import { StarRating } from './StarRating';
import { formatDistanceToNow } from 'date-fns';
import type { Doc } from '@repo/api/convex/_generated/dataModel';
import { theme } from '../theme';

interface ReviewDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  review: Doc<"venueReviews"> | null;
}

export const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
  isVisible,
  onClose,
  review
}) => {
  if (!review) return null;

  const reviewDate = new Date(review.createdAt);
  const timeAgo = formatDistanceToNow(reviewDate, { addSuffix: true });

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>Review</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <XIcon size={24} color={theme.colors.zinc[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Review Header */}
          <View style={styles.reviewHeader}>
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
            <StarRating rating={review.rating} size={18} />
          </View>

          {/* Venue Info */}
          <View style={styles.venueInfo}>
            <Text style={styles.venueLabel}>Review for</Text>
            <Text style={styles.venueName}>{review.venueSnapshot.name}</Text>
          </View>

          {/* Full Comment */}
          {review.comment && (
            <View style={styles.commentSection}>
              <Text style={styles.sectionTitle}>Review</Text>
              <Text style={styles.comment}>{review.comment}</Text>
            </View>
          )}

          {/* Empty state if no comment */}
          {!review.comment && (
            <View style={styles.noCommentSection}>
              <Text style={styles.noCommentText}>
                This reviewer left a star rating without a written comment.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.zinc[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.zinc[100],
  },
  headerLeft: {
    width: 40,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.zinc[100],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.zinc[900],
  },
  content: {
    flex: 1,
    padding: 20,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.zinc[100],
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.zinc[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.zinc[700],
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.zinc[900],
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 14,
    color: theme.colors.zinc[500],
  },
  venueInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  venueLabel: {
    fontSize: 14,
    color: theme.colors.zinc[500],
    marginBottom: 4,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.zinc[900],
  },
  commentSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.zinc[100],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.zinc[900],
    marginBottom: 12,
  },
  comment: {
    fontSize: 16,
    color: theme.colors.zinc[700],
    lineHeight: 24,
  },
  noCommentSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.zinc[100],
    alignItems: 'center',
  },
  noCommentText: {
    fontSize: 14,
    color: theme.colors.zinc[500],
    textAlign: 'center',
    fontStyle: 'italic',
  },
});